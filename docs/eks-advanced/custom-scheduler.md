---
sidebar_position: 1
---

# Configure MostAllocated Scheduler Strategy in Amazon EKS

### Prerequisites

- Install the `eksctl`

Create a basic cluster with default configuration

```bash
eksctl create cluster --name eksdemo --region us-west-2
.......
[✔]  EKS cluster "eksdemo" in "us-west-2" region is ready
```

Wait for the cluster message as shown above and export the following `env` variables.

```bash
export AWS_REGION=us-west-2
export EKS_CLUSTER=eksdemo
```

As of this writing, Amazon EKS doesn't allow to customize the `kube-scheduler` configuration. Many customers ask how they can use `MostAllocated` strategy to efficiently binpack their worker nodes. Let's see how can we create a custom scheduler with `MostAllocated` strategy and assign it to our k8s deployments.

### Step 1: Create `MostAllocated` kube-scheduler configuration

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
data:
  my-scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1
    kind: KubeSchedulerConfiguration
    profiles:
    - pluginConfig:
      - args:
          scoringStrategy:
            resources:
            # Update these weights according to your requirements
            - name: cpu
              weight: 1
            - name: memory
              weight: 1
            # Considering GPU resources in utilization calculation
            - name: nvidia.com/gpu
              weight: 1
            type: MostAllocated
        name: NodeResourcesFit
      plugins:
        score:
          enabled:
          - name: NodeResourcesFit
            weight: 1
          disabled:
          # Disabling these plugins to avoid spreading the pods
          - name: NodeResourcesBalancedAllocation
          - name: PodTopologySpread
      schedulerName: my-scheduler
    # Enabling leaderElection require additional permissions to the SA
    leaderElection:
      leaderElect: true
      resourceNamespace: kube-system    
      resourceName: my-scheduler
kind: ConfigMap
metadata:
  name: most-allocated-scheduler-policy
  namespace: kube-system
EOF
```

```output
configmap/most-allocated-scheduler-policy created
```

### Step 2: Create ServiceAccount and ClusterRolebindings for the custom scheduler

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-scheduler
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: my-scheduler-as-kube-scheduler
subjects:
- kind: ServiceAccount
  name: my-scheduler
  namespace: kube-system
roleRef:
  kind: ClusterRole
  name: system:kube-scheduler
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: my-scheduler-as-volume-scheduler
subjects:
- kind: ServiceAccount
  name: my-scheduler
  namespace: kube-system
roleRef:
  kind: ClusterRole
  name: system:volume-scheduler
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: my-scheduler-extension-apiserver-authentication-reader
  namespace: kube-system
roleRef:
  kind: Role
  name: extension-apiserver-authentication-reader
  apiGroup: rbac.authorization.k8s.io
subjects:
- kind: ServiceAccount
  name: my-scheduler
  namespace: kube-system
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: my-scheduler
rules:
- apiGroups:
  - coordination.k8s.io
  resources:
  - leases
  verbs:
  - create
  - get
  - list
  - update
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: my-scheduler
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: my-scheduler
subjects:
- kind: ServiceAccount
  name: my-scheduler
  namespace: kube-system
EOF
```

```output
serviceaccount/my-scheduler created
clusterrolebinding.rbac.authorization.k8s.io/my-scheduler-as-kube-scheduler created
clusterrolebinding.rbac.authorization.k8s.io/my-scheduler-as-volume-scheduler created
rolebinding.rbac.authorization.k8s.io/my-scheduler-extension-apiserver-authentication-reader created
clusterrole.rbac.authorization.k8s.io/my-scheduler created
clusterrolebinding.rbac.authorization.k8s.io/my-scheduler created
```

### Step 3: Deploy the custom scheduler using above configuration

**Make sure your kube-scheduler image matches your EKS cluster version**

```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    component: scheduler
    tier: control-plane
  name: my-scheduler
  namespace: kube-system
spec:
  selector:
    matchLabels:
      component: scheduler
      tier: control-plane
  replicas: 1
  template:
    metadata:
      labels:
        component: scheduler
        tier: control-plane
        version: second
    spec:
      serviceAccountName: my-scheduler
      containers:
      - command:
        - /usr/local/bin/kube-scheduler
        args:
        - --config=/etc/kubernetes/my-scheduler/my-scheduler-config.yaml
        - --leader-elect=true
        # log verbose level
        - --v=4
        # update the image based on your EKS version
        image: registry.k8s.io/kube-scheduler:v1.28.5
        livenessProbe:
          httpGet:
            path: /healthz
            port: 10259
            scheme: HTTPS
          initialDelaySeconds: 15
        name: kube-second-scheduler
        readinessProbe:
          httpGet:
            path: /healthz
            port: 10259
            scheme: HTTPS
        resources:
          requests:
            cpu: '0.1'
        securityContext:
          privileged: false
        volumeMounts:
          - name: config-volume
            mountPath: /etc/kubernetes/my-scheduler
      hostNetwork: false
      hostPID: false
      volumes:
        - name: config-volume
          configMap:
            name: most-allocated-scheduler-policy
EOF
```

```output
deployment.apps/my-scheduler created
```

### Step 4: Deploy a sample application

```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: nginx
  name: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  strategy: {}
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: nginx
        name: nginx
      schedulerName: my-scheduler
EOF
```

```output
deployment.apps/nginx created
```

nginx pods will be scheduled to a node with higher utilization based on the scoring strategy defined in the Scheduler Configuration.

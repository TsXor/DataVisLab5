# 运行方式：

在**项目文件夹**下（即`vite.config.ts`所在的文件夹），运行以下命令：
```bash
# 安装依赖
npm install
# 启动开发环境并预览
npm run dev
```
打包发布步骤待补充。

# 项目说明：

## 项目逻辑实现简介：

### 关键亮点
1. 项目采用了Vue的模板语法，大幅提升了动态操作DOM时的可读性。
2. 项目采用了Vue的响应式系统，使得各组件更加数据驱动，且无需繁琐的手动更新。
3. 项目采用了真正有效的TypeScript类型检查，消除了了代码中的大部分低级错误。
4. 项目以简洁和可读为目标，力求解耦组件、降低心智负担。

### 入口点
- `index.html`提供最基本的框架。
- `main.ts`挂载了Vue和Pinia，是所有脚本和组件的入口。
- `App.vue`是根组件，显示了主要的子组件结构。

### 核心算法：`@/core`

#### 图算法：`graph`
1. `graph.ts`实现了图结构的基本定义，是一种十字链表的变体。
2. `shortest-path.ts`实现了`floyd`和`dijkstra`两种最短路算法。

#### 数据定义
1. `dtypes.d.ts`标定了内置JSON数据的类型。
2. `data-adapater.ts`实现了异步获取数据的逻辑。
3. `data-utils.ts`实现了各种特定的算法。

#### 全局状态：`store.ts`
此文件使用Pinia定义了各种全局状态。  
1. `useRemoteDataStore`将异步数据转化为响应式状态。
2. `useGraphStore`代表图数据和由它计算出的衍生数据，如最短路和数据范围。
3. `useSelectionStore`代表各种全局性的选择，例如热力图中选择的最短路和地图中选择的节点和边。
4. `useFilterStore`代表目前生效的过滤器。

### 主要子组件：`@/components`

#### 参数管理：`ParamsExplorer`
展示已选择的节点/边的参数，实现参数的获取、设置、保存、加载等功能。  
编辑器细节的实现详见`ObjectEditor`组件。  

#### 过滤器管理：`FilterExplorer`
展示过滤器的具体数值并可精确编辑。（大致范围可直接在线路图内的参考轴上调整）  

#### 侧边栏：`InfoPanel`与`VisualPanel`
`InfoPanel`为左侧栏，`VisualPanel`为右侧栏。  
这两个部件都继承自`BaseSwitch`，它们与侧边栏中包含的具体部件无关，只负责切换。  
拖拽的实现详见`Dragger`组件。  

#### 地图、线路图、拓扑视图：`MultiGraph`
`MultiGraph`中实现了SVG视图的缩放，主要功能分散在更子集的组件中。
1. `MapView`实现了背景地图的显示与交互。
2. `GraphView`实现了线路图的显示与交互。
3. `DistanceTopology`实现了“拓扑视图”，即可交互的力引导图。
4. `DataSuspense`负责显示数据的请求状态并提供友好的报错。

#### 热力图：`HeatMap`
实现了最短距离的热力图，包含具体线路的悬停显示。  
在此处点击选择路线后，在地图中会同时出现高亮。  

#### 密度图：`DensityCurve`
实现了所有线路距离的密度图，附带柏青哥机式的堆叠效果。

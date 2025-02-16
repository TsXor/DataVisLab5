<template>
  <p class="intro-text">本项目旨在提供可交互的铁路信息可视化分析工具，侧重于分析站点间的最短距离和最短通行时间，以及站点和线路的新建或删除对铁路运行的影响。</p>
  <p class="intro-text">使用指南：</p>
  <ul class="intro-text">
    <li>缩放与平移</li>
    <ul class="intro-text">
      <li>鼠标滚轮滚动：放大或缩小视图。</li>
      <li>鼠标左键拖动：平移视图。</li>
      <li>双击鼠标左键：放大视图</li>
      <li>在地图视图下点击省份：聚焦到该省份。再次点击该省份可恢复正常视图。</li>
      <li>在地图视图下点击空白区域：恢复正常视图。</li>
    </ul>
    <li>地图视图交互</li>
    <ul class="intro-text">
      <li>鼠标左键点击站点：选择该站点为起始点。</li>
      <li>鼠标右键点击站点：选择该站点为终止点。</li>
      <li>鼠标左键点击线路：选择该线路。</li>
      <li class="todo">鼠标悬停于站点或线路上：显示该站点或线路的属性信息。</li>
    </ul>
    <li>顶部控制栏</li>
    <ul class="intro-text">
      <li>选框：用于切换视图。</li>
      <ul class="intro-text">
        <li>地图视图：展示站点地理位置以及铁路连接情况。</li>
        <li>距离拓扑：力引导图，展示节点间的拓扑连接关系，边引力与距离成正比。</li>
        <li class="todo">时间视图：图中边长与通行时间成正比，其余同距离拓扑视图。</li>
      </ul>
      <li>重置视图位置：去除当前的缩放状态。</li>
      <li>（仅距离拓扑）重置距离拓扑：将节点位置移到地图位置，并重新开始模拟。</li>
    </ul>
    <li>左侧边栏</li>
    <ul class="intro-text">
      <li>介绍：你正在读的这个东西。</li>
      <li>过滤器：用于精确筛选站点和线路。</li>
      <li>参数：用于显示并编辑站点或铁路路段信息。</li>
    </ul>
    <li>右侧边栏</li>
    <ul class="intro-text">
      <li>距离热力图：显示节点间的最短路径及其长度。</li>
      <li>距离密度图：显示边长度的分布。</li>
    </ul>
  </ul>
</template>

<style scoped>
.todo {
  color: grey;
  text-decoration: line-through;
}
</style>

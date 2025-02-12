export class Vertex<V, E> {
  id: {};
  in: Map<Vertex<V, E>, Edge<V, E>>;
  out: Map<Vertex<V, E>, Edge<V, E>>;
  data: V;

  constructor(id: {}, data: V) {
    this.id = id;
    this.in = new Map();
    this.out = new Map();
    this.data = data;
  }
};

export class Edge<V, E> {
  source: Vertex<V, E>; // 起点
  target: Vertex<V, E>; // 终点
  data: E;

  constructor(
    source: Vertex<V, E>,
    target: Vertex<V, E>,
    data: E
  ) {
    source.out.set(target, this);
    target.in.set(source, this);
    this.source = source;
    this.target = target;
    this.data = data;
  }

  detach() {
    this.source.out.delete(this.target);
    this.target.in.delete(this.source);
  }

  isSelfLoop() {
    return this.source === this.target;
  }
};

export class Graph<V, E> {
  vertices: Map<{}, Vertex<V, E>>;

  constructor() {
    this.vertices = new Map();
  }

  getVertex(id: {}) {
    return this.vertices.get(id);
  }

  findVertex(vertex: Vertex<V, E>) {
    return this.getVertex(vertex.id);
  }

  addVertex(id: {}, data: V) {
    let vertex = new Vertex<V, E>(id, data);
    this.vertices.set(id, vertex);
    return vertex;
  }

  delVertex(vertex: Vertex<V, E>) {
    for (const e of vertex.out.values()) { e.detach(); }
    for (const e of vertex.in.values()) { e.detach(); }
    this.vertices.delete(vertex.id);
  }

  *inOrderEdges() {
    for (const vertex of this.vertices.values()) {
      for (const edge of vertex.in.values()) yield edge;
    } 
  }

  *outOrderEdges() {
    for (const vertex of this.vertices.values()) {
      for (const edge of vertex.out.values()) yield edge;
    } 
  }

  getEdge(source: Vertex<V, E>, target: Vertex<V, E>) {
    return source.out.get(target);
  }

  addEdge(source: Vertex<V, E>, target: Vertex<V, E>, data: E) {
    const old = this.getEdge(source, target);
    if (old) { old.data = data; return old; }
    return new Edge(source, target, data);
  }

  delEdge(edge: Edge<V, E>) {
    edge.detach();
  }
};

export type VertexOf<T> = T extends Graph<infer V, infer E> ? Vertex<V, E> : never;
export type EdgeOf<T> = T extends Graph<infer V, infer E> ? Edge<V, E> : never;

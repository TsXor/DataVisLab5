import PriorityQueue from 'priorityqueuejs';
import { Graph, type Edge, type EdgeOf, type VertexOf } from './graph';

export type Path = { weight: number; trace?: [Edge<null, Path>, Edge<null, Path>]; };
export type PathGraph = Graph<null, Path>;
export type PathVertex = VertexOf<PathGraph>;
export type PathEdge = EdgeOf<PathGraph>;

export function* walkPathVertices(path: PathEdge): Generator<PathVertex> {
  if (path.data.trace) {
    const [l, r] = path.data.trace;
    yield* walkPathVertices(l);
    yield l.target;
    yield* walkPathVertices(r);
  }
}

export function* walkPathEdges(path: PathEdge): Generator<PathEdge> {
  if (path.data.trace) {
    const [l, r] = path.data.trace;
    yield* walkPathEdges(l);
    yield* walkPathEdges(r);
  } else {
    yield path;
  }
}

export function extractWeights<V, E>(G: Graph<V, E>, weight: (edge: Edge<V, E>) => number): PathGraph {
  const W = new Graph<null, Path>();
  for (const vertex of G.vertices.values()) { W.addVertex(vertex.id, null); }
  for (const edge of G.outOrderEdges()) {
    const source = W.getVertex(edge.source.id)!;
    const target = W.getVertex(edge.target.id)!;
    W.addEdge(source, target, { weight: weight(edge) });
  }
  for (const vertex of W.vertices.values()) {
    W.addEdge(vertex, vertex, { weight: 0 });
  }
  return W;
}

export function floyd(P: PathGraph) {
  for (const vertex of P.vertices.values()) {
    for (const [source, inEdge] of vertex.in) {
      if (inEdge.isSelfLoop()) continue;
      for (const [target, outEdge] of vertex.out) {
        if (outEdge.isSelfLoop()) continue;
        const edge = P.getEdge(source, target) ?? P.addEdge(source, target, { weight: Infinity });
        const loosen = inEdge.data.weight + outEdge.data.weight;
        if (loosen < edge.data.weight) {
          edge.data.weight = loosen;
          edge.data.trace = [inEdge, outEdge];
        }
      }
    }
  }
  return P;
}

export function dijkstra(P: PathGraph, source: PathVertex) {
  const pq = new PriorityQueue<PathEdge>((a, b) => a.data.weight - b.data.weight);
  for (const edge of source.out.values()) { if (!edge.isSelfLoop()) pq.enq(edge); }
  while (pq.size() > 0) {
    const baseEdge = pq.deq();
    for (const [target, nextEdge] of baseEdge.target.out) {
      if (nextEdge.isSelfLoop()) continue;
      const edge = P.getEdge(source, target) ?? P.addEdge(source, target, { weight: Infinity });
      const loosen = baseEdge.data.weight + nextEdge.data.weight;
      if (loosen < edge.data.weight) {
        edge.data.weight = loosen;
        edge.data.trace = [baseEdge, nextEdge];
        pq.enq(edge);
      }
    }
  }
  return P;
}

export function multiDijkstra(P: PathGraph) {
  for (const source of P.vertices.values()) { dijkstra(P, source); }
  return P;
}

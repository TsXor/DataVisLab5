import PriorityQueue from 'priorityqueuejs';
import { Graph, Edge, type EdgeOf, Vertex, type VertexOf } from './graph';

export type Path<V, E> = { weight: number; trace?: [Edge<null, Path<V, E>>, Edge<null, Path<V, E>>]; };
export type PathGraph<V, E> = Graph<null, Path<V, E>>;
export type PathVertex<V, E> = VertexOf<PathGraph<V, E>>;
export type PathEdge<V, E> = EdgeOf<PathGraph<V, E>>;
export type PathOf<G> = G extends Graph<infer V, infer E> ? PathGraph<V, E> : never;

export function* walkPathVertices<V, E>(path: PathEdge<V, E>): Generator<PathVertex<V, E>> {
  if (path.data.trace) {
    const [l, r] = path.data.trace;
    yield* walkPathVertices(l);
    yield l.target;
    yield* walkPathVertices(r);
  }
}

export function* walkPathEdges<V, E>(path: PathEdge<V, E>): Generator<PathEdge<V, E>> {
  if (path.data.trace) {
    const [l, r] = path.data.trace;
    yield* walkPathEdges(l);
    yield* walkPathEdges(r);
  } else {
    yield path;
  }
}

export function extractWeights<V, E>(G: Graph<V, E>, weight: (edge: Edge<V, E>) => number): PathGraph<V, E> {
  const W = new Graph<null, Path<V, E>>();
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

export function floyd<V, E>(P: PathGraph<V, E>) {
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

export function dijkstra<V, E>(P: PathGraph<V, E>, source: PathVertex<V, E>) {
  const pq = new PriorityQueue<EdgeOf<typeof P>>((a, b) => a.data.weight - b.data.weight);
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

export function multiDijkstra<V, E>(P: PathGraph<V, E>) {
  for (const source of P.vertices.values()) { dijkstra<V, E>(P, source); }
  return P;
}

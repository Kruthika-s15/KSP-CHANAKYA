'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type GraphNode = {
  id: string;
  type: 'case' | 'accused' | 'victim' | 'complainant' | 'officer';
  label: string;
  sublabel?: string | null;
  case_master_id?: number | null;
  is_focus?: boolean;
  is_secondary_case?: boolean;
};

export type GraphEdge = {
  source: string;
  target: string;
  relation: string;
  label?: string | null;
};

type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number };

const TYPE_STYLE: Record<GraphNode['type'], { fill: string; radius: number }> = {
  case: { fill: '#3b82f6', radius: 10 },       // red-500
  accused: { fill: '#ef4444', radius: 7 },     // red-500
  victim: { fill: '#10b981', radius: 6 },      // emerald-500
  complainant: { fill: '#f59e0b', radius: 6 }, // amber-500
  officer: { fill: '#a855f7', radius: 7 },     // purple-500
};

const IDENTITY_RELATIONS = new Set(['SAME_PERSON', 'SAME_BIOMETRIC']);

const WIDTH = 1000;
const HEIGHT = 640;

function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): SimNode[] {
  // Deterministic pseudo-random start positions (seeded by index) so the
  // layout doesn't jump around between renders of the same data.
  const sim: SimNode[] = nodes.map((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
    const r = 180 + (i % 5) * 30;
    return {
      ...n,
      x: WIDTH / 2 + Math.cos(angle) * r,
      y: HEIGHT / 2 + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
    };
  });

  const index = new Map(sim.map((n, i) => [n.id, i]));
  const links = edges
    .map((e) => ({ a: index.get(e.source), b: index.get(e.target) }))
    .filter((l) => l.a !== undefined && l.b !== undefined) as { a: number; b: number }[];

  const ITERATIONS = 140;
  const REPULSION = 2600;
  const LINK_DISTANCE = 90;
  const LINK_STRENGTH = 0.06;
  const CENTER_STRENGTH = 0.01;
  const DAMPING = 0.85;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion between every pair (fine for graphs up to a few hundred nodes)
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const dx = sim[i].x - sim[j].x;
        const dy = sim[i].y - sim[j].y;
        const distSq = Math.max(dx * dx + dy * dy, 1);
        const force = REPULSION / distSq;
        const dist = Math.sqrt(distSq);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        sim[i].vx += fx;
        sim[i].vy += fy;
        sim[j].vx -= fx;
        sim[j].vy -= fy;
      }
    }

    // Spring attraction along edges
    for (const { a, b } of links) {
      const na = sim[a];
      const nb = sim[b];
      const dx = nb.x - na.x;
      const dy = nb.y - na.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - LINK_DISTANCE) * LINK_STRENGTH;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      na.vx += fx;
      na.vy += fy;
      nb.vx -= fx;
      nb.vy -= fy;
    }

    // Gentle centering so the graph doesn't drift off-canvas
    for (const n of sim) {
      n.vx += (WIDTH / 2 - n.x) * CENTER_STRENGTH;
      n.vy += (HEIGHT / 2 - n.y) * CENTER_STRENGTH;
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.min(Math.max(n.x, 30), WIDTH - 30);
      n.y = Math.min(Math.max(n.y, 30), HEIGHT - 30);
    }
  }

  return sim;
}

export default function NetworkGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const router = useRouter();
  const [positions, setPositions] = useState<SimNode[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout is computed client-side only, after mount, so server-rendered
  // HTML never contains randomized/simulated coordinates (no hydration mismatch).
  useEffect(() => {
    setSelectedId(null);
    setPositions(layoutGraph(nodes, edges));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(nodes.map((n) => n.id)), JSON.stringify(edges.map((e) => `${e.source}-${e.target}`))]);

  const posById = useMemo(() => {
    const m = new Map<string, SimNode>();
    (positions || []).forEach((n) => m.set(n.id, n));
    return m;
  }, [positions]);

  const connectedIds = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>([selectedId]);
    edges.forEach((e) => {
      if (e.source === selectedId) s.add(e.target);
      if (e.target === selectedId) s.add(e.source);
    });
    return s;
  }, [selectedId, edges]);

  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) : null;

  if (!positions) {
    return (
      <div className="h-[640px] flex items-center justify-center text-zinc-500 text-sm">
        Laying out relationship graph...
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
        No cases match the current filters — nothing to graph yet.
      </div>
    );
  }

  const handleNodeClick = (n: GraphNode) => {
    if (n.type === 'case' && n.case_master_id) {
      router.push(`/crimes/${n.case_master_id}`);
      return;
    }
    setSelectedId((prev) => (prev === n.id ? null : n.id));
  };

  return (
    <div className="relative" ref={containerRef}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[640px] bg-zinc-950 rounded-lg border border-zinc-800">
        <g>
          {edges.map((e, i) => {
            const a = posById.get(e.source);
            const b = posById.get(e.target);
            if (!a || !b) return null;
            const isIdentity = IDENTITY_RELATIONS.has(e.relation);
            const dimmed = connectedIds && !(connectedIds.has(e.source) && connectedIds.has(e.target));
            return (
              <line
                key={`${e.source}-${e.target}-${i}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={isIdentity ? '#f97316' : '#3f3f46'}
                strokeWidth={isIdentity ? 2 : 1}
                strokeDasharray={isIdentity ? '4 3' : undefined}
                opacity={dimmed ? 0.08 : isIdentity ? 0.9 : 0.5}
              />
            );
          })}
        </g>
        <g>
          {positions.map((n) => {
            const style = TYPE_STYLE[n.type];
            const dimmed = connectedIds && !connectedIds.has(n.id);
            const radius = style.radius + (n.is_focus ? 4 : 0);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onClick={() => handleNodeClick(n)}
                className="cursor-pointer"
                opacity={dimmed ? 0.25 : 1}
              >
                {n.is_focus && (
                  <circle r={radius + 5} fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.6} />
                )}
                {n.is_secondary_case && (
                  <circle r={radius + 4} fill="none" stroke="#f97316" strokeWidth={1.5} strokeDasharray="2 2" />
                )}
                <circle
                  r={radius}
                  fill={style.fill}
                  stroke={selectedId === n.id ? '#ffffff' : '#18181b'}
                  strokeWidth={selectedId === n.id ? 2 : 1.5}
                />
                <text
                  y={radius + 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#d4d4d8"
                  className="select-none pointer-events-none"
                >
                  {n.label.length > 16 ? `${n.label.slice(0, 15)}…` : n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute top-3 left-3 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 text-xs space-y-1.5 backdrop-blur">
        {(Object.keys(TYPE_STYLE) as GraphNode['type'][]).map((t) => (
          <div key={t} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_STYLE[t].fill }} />
            <span className="text-zinc-400 capitalize">{t}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800 mt-1.5">
          <span className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: '#f97316' }} />
          <span className="text-zinc-400">Shared identity</span>
        </div>
      </div>

      {/* Selected node info panel */}
      {selectedNode && (
        <div className="absolute top-3 right-3 bg-zinc-900/95 border border-zinc-800 rounded-lg p-4 text-sm w-64 backdrop-blur">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1 capitalize">{selectedNode.type}</div>
          <div className="text-white font-medium mb-1">{selectedNode.label}</div>
          {selectedNode.sublabel && <div className="text-zinc-400 text-xs mb-2">{selectedNode.sublabel}</div>}
          <div className="text-xs text-zinc-500">
            {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length} connection(s)
          </div>
          <button
            onClick={() => setSelectedId(null)}
            className="mt-3 text-xs text-red-400 hover:text-red-300"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}

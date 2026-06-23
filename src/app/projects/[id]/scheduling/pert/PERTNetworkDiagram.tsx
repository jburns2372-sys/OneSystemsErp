'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

// --- Custom Node Component for CPM ---
const CPMNode = ({ data }: any) => {
  const isCritical = data.criticalPath;
  const bgColor = isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 0, 0, 0.4)';
  const borderColor = isCritical ? '#ef4444' : 'var(--glass-border)';

  return (
    <div style={{ 
      background: bgColor, 
      border: `2px solid ${borderColor}`,
      borderRadius: '8px',
      padding: '0',
      minWidth: '180px',
      color: 'white',
      boxShadow: isCritical ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 4px 6px rgba(0,0,0,0.3)',
      fontSize: '0.75rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      {/* Top Header: ES / Dur / EF */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${borderColor}`, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ flex: 1, padding: '4px', textAlign: 'center', borderRight: `1px solid ${borderColor}` }}>ES: {data.es ?? '-'}</div>
        <div style={{ flex: 1, padding: '4px', textAlign: 'center', borderRight: `1px solid ${borderColor}`, fontWeight: 'bold' }}>{data.duration}d</div>
        <div style={{ flex: 1, padding: '4px', textAlign: 'center' }}>EF: {data.ef ?? '-'}</div>
      </div>
      
      {/* Body: Activity Name */}
      <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{data.code}</div>
        <div style={{ fontSize: '0.85rem' }}>{data.name}</div>
      </div>
      
      {/* Bottom Footer: LS / Float / LF */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ flex: 1, padding: '4px', textAlign: 'center', borderRight: `1px solid ${borderColor}` }}>LS: {data.ls ?? '-'}</div>
        <div style={{ flex: 1, padding: '4px', textAlign: 'center', borderRight: `1px solid ${borderColor}`, color: isCritical ? '#ef4444' : '#10b981' }}>TF: {data.tf ?? 0}</div>
        <div style={{ flex: 1, padding: '4px', textAlign: 'center' }}>LF: {data.lf ?? '-'}</div>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

const nodeTypes = { cpmNode: CPMNode };

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 100;

  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

export default function PERTNetworkDiagram({ schedule }: { schedule: any }) {
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!schedule || !schedule.activities) return { nodes: [], edges: [] };

    const nodes = schedule.activities.map((act: any) => ({
      id: act.id,
      type: 'cpmNode',
      data: {
        name: act.name,
        code: act.activityCode || '-',
        duration: act.plannedDuration || 0,
        es: act.plannedStartDate ? new Date(act.plannedStartDate).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'}) : null,
        ef: act.plannedFinishDate ? new Date(act.plannedFinishDate).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'}) : null,
        ls: act.actualStartDate ? new Date(act.actualStartDate).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'}) : null, // Assuming actuals or late dates
        lf: act.actualFinishDate ? new Date(act.actualFinishDate).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'}) : null,
        tf: act.totalFloat || 0,
        criticalPath: act.criticalPath || false
      },
      position: { x: 0, y: 0 } // Dagre will position
    }));

    const edges = schedule.dependencies?.map((dep: any) => {
      const isCriticalLink = 
        schedule.activities.find((a:any) => a.id === dep.predecessorId)?.criticalPath &&
        schedule.activities.find((a:any) => a.id === dep.successorId)?.criticalPath;

      return {
        id: dep.id,
        source: dep.predecessorId,
        target: dep.successorId,
        type: 'smoothstep',
        animated: isCriticalLink,
        label: dep.type !== 'FS' ? `${dep.type} ${dep.lagDays ? `+${dep.lagDays}` : ''}` : '',
        style: { 
          stroke: isCriticalLink ? '#ef4444' : 'var(--text-secondary)',
          strokeWidth: isCriticalLink ? 3 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCriticalLink ? '#ef4444' : 'var(--text-secondary)',
        },
        labelStyle: { fill: 'var(--text-secondary)', fontWeight: 700, fontSize: 10 },
        labelBgStyle: { fill: 'rgba(0,0,0,0.7)', padding: 4 }
      };
    }) || [];

    return getLayoutedElements(nodes, edges);
  }, [schedule]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // If data changes, re-layout
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (!schedule || !schedule.activities || schedule.activities.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No activities available to generate PERT diagram.</div>;
  }

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 200px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
      
      {/* Legend / Info Overlay */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>PERT / CPM Diagram</h4>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <div style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '3px' }}></div>
            Critical Path Node
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <div style={{ width: '12px', height: '3px', background: '#ef4444' }}></div>
            Critical Path Link
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--glass-border)', borderRadius: '3px' }}></div>
            Non-Critical Node
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
      >
        <Background color="rgba(255,255,255,0.05)" gap={16} />
        <Controls style={{ background: 'rgba(0,0,0,0.5)', fill: 'white' }} />
        <MiniMap 
          nodeColor={(node) => {
            return node.data?.criticalPath ? '#ef4444' : 'rgba(255,255,255,0.2)';
          }}
          style={{ background: 'rgba(0,0,0,0.8)' }}
          maskColor="rgba(0,0,0,0.4)"
        />
      </ReactFlow>
    </div>
  );
}

"use client"

import React, { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';

interface GraphData {
  nodes: { id: string; group: number; val: number }[];
  links: { source: string; target: string; value: number }[];
}

interface Props {
  data: GraphData;
  onNodeClick?: (node: any) => void;
}

const ForceGraph3DComponent: React.FC<Props> = ({ data, onNodeClick }) => {
  const fgRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    // Aim at node from outside it
    const distance = 60; // Increased distance for better framing
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new pos
        node, // lookAt property
        2000  // Faster, more cinematic transition
      );
    }
    
    if (onNodeClick) onNodeClick(node);
  }, [onNodeClick]);

  if (!mounted) return <div className="w-full h-full flex items-center justify-center text-white/20">Initializing 3D Engine...</div>;

  return (
    <div className="w-full h-full min-h-[500px] relative rounded-3xl overflow-hidden glass-panel group">
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        backgroundColor="rgba(0,0,0,0)"
        nodeLabel="id"
        nodeAutoColorBy="group"
        
        // --- Uniform Visualization ---
        onEngineStop={() => {
          if (fgRef.current) {
            fgRef.current.zoomToFit(1200, 150); // Frame centered with padding
          }
        }}
        d3AlphaDecay={0.015} // Slower, more fluid layout settling
        
        // --- High Fidelity Rendering ---
        rendererConfig={{
          antialias: true,
          alpha: true,
          precision: 'highp',
          powerPreference: 'high-performance'
        }}
        
        // --- Awesome Aesthetics ---
        linkDirectionalParticles={4}
        linkDirectionalParticleSpeed={d => (d as any).value * 0.002}
        linkDirectionalParticleWidth={1.5}
        linkWidth={1.2}
        linkColor={() => 'rgba(59, 130, 246, 0.25)'}
        
        nodeThreeObject={(node: any) => {
          const group = node.group || 1;
          const color = group === 1 ? '#3B82F6' : group === 2 ? '#10B981' : '#F59E0B';
          
          // Outer Glow Sphere
          const geometry = new THREE.SphereGeometry(node.val || 5, 32, 32);
          const material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            shininess: 150,
            emissive: color,
            emissiveIntensity: 0.8 // High burn for 'Awesome' glow
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          
          // Add a subtle point light to each node for recursive shading
          const light = new THREE.PointLight(color, 1, 30);
          mesh.add(light);
          
          return mesh;
        }}
        
        onNodeClick={handleNodeClick}
        enableNodeDrag={true} // Allow interaction but keep it constrained
        showNavInfo={false}
      />
      
      {/* 3D Legend & Interaction Controls */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
           onClick={() => fgRef.current && fgRef.current.zoomToFit(800, 100)}
           className="p-2 bg-black/40 hover:bg-black/60 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
        >
          Reset Frame
        </button>
      </div>

      <div className="absolute bottom-6 left-6 flex flex-col gap-2 p-4 glass-card pointer-events-none border border-white/5 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-[0_0_12px_#3B82F6]" />
          <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] italic">Language Matrix</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_12px_#10B981]" />
          <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] italic">Framework Lattice</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_12px_#F59E0B]" />
          <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] italic">Cloud & Infra</span>
        </div>
      </div>
    </div>
  );
};

export default ForceGraph3DComponent;

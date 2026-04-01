"use client"

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the ForceGraph3D component with SSR disabled
const ForceGraph3D = dynamic(() => import('./force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center bg-black/20 rounded-3xl animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Waking Up 3D Engine...</span>
      </div>
    </div>
  )
});

interface Props {
  data: any;
  onNodeClick?: (node: any) => void;
}

const ForceGraphClient: React.FC<Props> = ({ data, onNodeClick }) => {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-black/20 rounded-3xl">
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">No Skill Constellation Data Available</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px]">
      <ForceGraph3D data={data} onNodeClick={onNodeClick} />
    </div>
  );
};

export default ForceGraphClient;

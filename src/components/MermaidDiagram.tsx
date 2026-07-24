import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid once
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    }
  });
} catch (e) {
  console.error('Failed to initialize mermaid', e);
}

let uniqueIdCounter = 0;

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!chart) return;
      
      const id = `mermaid-svg-${uniqueIdCounter++}`;
      try {
        setError(null);
        
        let cleanChart = chart.trim();
        // If it starts with markdown code block syntax, strip it
        if (cleanChart.startsWith('```mermaid')) {
          cleanChart = cleanChart.substring(10);
        }
        if (cleanChart.endsWith('```')) {
          cleanChart = cleanChart.substring(0, cleanChart.length - 3);
        }
        cleanChart = cleanChart.trim();

        // Basic sanity checks for flowchart structure
        if (!cleanChart.startsWith('graph ') && !cleanChart.startsWith('flowchart ') && !cleanChart.startsWith('stateDiagram') && !cleanChart.startsWith('sequenceDiagram') && !cleanChart.startsWith('classDiagram')) {
          // If it is just lines of text, wrap it into a simple flowchart
          cleanChart = 'graph TD\n' + cleanChart;
        }

        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err: any) {
        console.error('Mermaid rendering failure, checking error: ', err);
        const badElement = document.getElementById(id);
        if (badElement) {
          badElement.remove();
        }
        if (isMounted) {
          setError(err?.message || 'Failed to parse diagram syntax. Please verify the diagram structure.');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl font-mono text-xs overflow-x-auto shadow-sm">
        <p className="font-bold mb-2">⚠️ Diagram Render Notice:</p>
        <pre className="whitespace-pre-wrap">{error}</pre>
        <p className="mt-2 text-[10px] text-slate-500 font-sans">Source Syntax:</p>
        <pre className="mt-1 text-[11px] opacity-75">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 animate-pulse">
        <span className="w-5 h-5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></span>
        <span className="text-xs font-medium">Drafting flow illustration...</span>
      </div>
    );
  }

  return (
    <div className="my-6 p-4 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition duration-200 overflow-x-auto flex justify-center">
      <div 
        ref={containerRef} 
        className="w-full max-w-2xl text-center flex justify-center mermaid-rendered-container"
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
    </div>
  );
}

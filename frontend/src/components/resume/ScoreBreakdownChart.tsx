"use client"

import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, ResponsiveContainer, Tooltip 
} from 'recharts';

interface ScoreBreakdown {
  keyword_match: number;
  formatting: number;
  quantified_achievements: number;
  section_completeness: number;
  action_verbs: number;
}

export const ScoreBreakdownChart = ({ data }: { data: ScoreBreakdown }) => {
  const chartData = [
    { subject: 'Keywords', value: data.keyword_match, fullMark: 25 },
    { subject: 'Formatting', value: data.formatting, fullMark: 20 },
    { subject: 'Impact', value: data.quantified_achievements, fullMark: 20 },
    { subject: 'Sections', value: data.section_completeness, fullMark: 20 },
    { subject: 'Verbs', value: data.action_verbs, fullMark: 15 },
  ];

  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.6}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1d25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
            itemStyle={{ color: 'var(--primary)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

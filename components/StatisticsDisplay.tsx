import React, { useEffect, useRef, useMemo } from 'react';
import { UserSession, TrialScore, RoundData } from '../types';
import { RefreshCcwIcon, ArrowLeftIcon, DownloadIcon } from './icons';
import { SCORE_PRECISION, TOTAL_ROUNDS, TRIALS_PER_ROUND, ROUND_SOUND_LEVELS } from '../constants';
import { Chart, registerables, Title, Tooltip, Legend, LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, Filler } from 'chart.js/auto';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BarWithErrorBarsController, LineWithErrorBarsController, PointWithErrorBar, BarWithErrorBar } from 'chartjs-chart-error-bars';

// Register necessary Chart.js components including BoxPlot and Filler for error bands
Chart.register(
  ...registerables,
  Title, Tooltip, Legend, Filler,
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement,
  BoxPlotController, BoxAndWiskers, // Register BoxPlot
  BarWithErrorBarsController,
  LineWithErrorBarsController,
  PointWithErrorBar,
  BarWithErrorBar,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Title,
  PointElement,
  LineElement
);

interface StatisticsDisplayProps {
  sessionData: UserSession;
  onResetSession: () => void;
  isDetailedView?: boolean;
  onBackToOverview?: () => void;
}

interface StatValues {
  average: number;
  median: number;
  best: number;
  stdDev: number;
  count: number;
  min: number;
  q1: number;
  q3: number;
  max: number;
  sem: number; // Standard Error of the Mean
}

interface RoundWithStats extends RoundData {
  stats: StatValues;
  soundLevel: string;
}

const calculateQuartiles = (arr: number[]): { q1: number, median: number, q3: number } => {
  if (arr.length === 0) return { q1: 0, median: 0, q3: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  const lowerHalf = sorted.slice(0, mid);
  const upperHalf = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);

  const calcMedian = (half: number[]) => {
    if (half.length === 0) return 0;
    const halfMid = Math.floor(half.length / 2);
    return half.length % 2 === 0 ? (half[halfMid - 1] + half[halfMid]) / 2 : half[halfMid];
  };

  return {
    q1: calcMedian(lowerHalf),
    median: median,
    q3: calcMedian(upperHalf),
  };
};


const calculateStats = (times: number[]): StatValues => {
  if (times.length === 0) return { average: 0, median: 0, best: 0, stdDev: 0, count: 0, min: 0, q1: 0, q3: 0, max: 0, sem: 0 };
  const sum = times.reduce((acc, t) => acc + t, 0);
  const average = sum / times.length;
  const sortedTimes = [...times].sort((a, b) => a - b);

  const best = sortedTimes[0];
  const min = sortedTimes[0];
  const max = sortedTimes[sortedTimes.length - 1];

  const { q1, median, q3 } = calculateQuartiles(sortedTimes);

  const stdDev = calculateStdDev(times, average);
  const sem = times.length > 0 ? stdDev / Math.sqrt(times.length) : 0;
  return { average, median, best, stdDev, count: times.length, min, q1, q3, max, sem };
};


const calculateStdDev = (numbers: number[], mean: number): number => {
  if (numbers.length < 2) return 0; // Standard deviation is not well-defined for fewer than 2 samples
  const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (numbers.length - 1); // Sample variance
  return Math.sqrt(variance);
};

const CHART_ROUND_ORDER = [1, 2, 4, 5, 3];

const formatDateForFilename = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

const escapeCsvCell = (cellData: any): string => {
  if (cellData === null || cellData === undefined) return '';
  const stringData = String(cellData);
  if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
    return `"${stringData.replace(/"/g, '""')}"`;
  }
  return stringData;
};

const exportDetailedSessionToCsv = (
  session: UserSession,
  overallStats: StatValues,
  roundsWithStats: RoundWithStats[]
) => {
  const headers = [
    'SessionID', 'UserName', 'UserSex', 'SessionStartTimeISO', 'SessionEndTimeISO',
    'RoundNumber', 'SoundLevel', 'TrialWithinRound', 'ReactionTimeMs',
    'RoundAverage', 'RoundMedian', 'RoundStdDev', 'RoundSEM',
    'OverallAverage', 'OverallMedian', 'OverallStdDev', 'OverallSEM'
  ];

  const rows: string[] = [];
  session.roundsData.forEach(round => {
    const soundLevel = ROUND_SOUND_LEVELS[round.roundNumber - 1] || "N/A";
    const roundStats = roundsWithStats.find(r => r.roundNumber === round.roundNumber)?.stats;

    round.trials.forEach(trial => {
      if (trial.time !== null) {
        rows.push([
          escapeCsvCell(session.sessionId),
          escapeCsvCell(session.user.name),
          escapeCsvCell(session.user.sex),
          escapeCsvCell(new Date(session.startTime).toISOString()),
          escapeCsvCell(session.endTime ? new Date(session.endTime).toISOString() : ''),
          escapeCsvCell(round.roundNumber),
          escapeCsvCell(soundLevel),
          escapeCsvCell(trial.trialNumber),
          escapeCsvCell(trial.time.toFixed(SCORE_PRECISION)),
          escapeCsvCell(roundStats?.average.toFixed(SCORE_PRECISION) || ''),
          escapeCsvCell(roundStats?.median.toFixed(SCORE_PRECISION) || ''),
          escapeCsvCell(roundStats?.stdDev.toFixed(SCORE_PRECISION) || ''),
          escapeCsvCell(roundStats?.sem.toFixed(SCORE_PRECISION) || ''),
          escapeCsvCell(overallStats.average.toFixed(SCORE_PRECISION)),
          escapeCsvCell(overallStats.median.toFixed(SCORE_PRECISION)),
          escapeCsvCell(overallStats.stdDev.toFixed(SCORE_PRECISION)),
          escapeCsvCell(overallStats.sem.toFixed(SCORE_PRECISION))
        ].join(','));
      }
    });
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const timestamp = formatDateForFilename(new Date());
  link.setAttribute("download", `session_detail_${session.sessionId.substring(0, 8)}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportSessionToPdf = async (sessionData: UserSession, overallStats: StatValues, roundsWithStats: (RoundData & { stats: StatValues, soundLevel: string })[]) => {
  // Create a temporary container for the content
  const container = document.createElement('div');
  container.style.width = '1200px'; // Fixed width for consistent layout
  container.style.padding = '40px';
  container.style.backgroundColor = 'white';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  // Clone the statistics display content
  const content = document.querySelector('.statistics-display')?.cloneNode(true) as HTMLElement;
  if (!content) {
    console.error('Could not find statistics display content');
    return;
  }

  // Remove interactive elements
  const buttons = content.querySelectorAll('button');
  buttons.forEach(button => button.remove());

  // Add the content to our container
  container.appendChild(content);

  try {
    // Wait for charts to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ensure all charts are properly rendered
    const charts = content.querySelectorAll('canvas');
    for (const chart of charts) {
      const chartInstance = Chart.getChart(chart);
      if (chartInstance) {
        chartInstance.draw();
      }
    }

    // Capture the content as an image
    const canvas = await html2canvas(container, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
      backgroundColor: 'white',
      onclone: (clonedDoc) => {
        // Ensure charts are rendered in the cloned document
        const clonedCharts = clonedDoc.querySelectorAll('canvas');
        for (const chart of clonedCharts) {
          const chartInstance = Chart.getChart(chart);
          if (chartInstance) {
            chartInstance.draw();
          }
        }
      }
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2] // Scale down to fit page
    });

    // Add the image to the PDF
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);

    // Save the PDF
    const timestamp = formatDateForFilename(new Date());
    pdf.save(`session_summary_${sessionData.sessionId.substring(0, 8)}_${timestamp}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

const downloadChartAsPng = (chartInstance: Chart | undefined, filename: string) => {
  if (chartInstance) {
    const image = chartInstance.toBase64Image('image/png', 1); // Quality 1
    const link = document.createElement('a');
    link.href = image;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    console.error("Chart instance not found for download.");
  }
};


export const StatisticsDisplay: React.FC<StatisticsDisplayProps> = ({
  sessionData,
  onResetSession,
  isDetailedView = false,
  onBackToOverview
}) => {
  const { user, roundsData, startTime, endTime, sessionId } = sessionData;

  const averageLineChartRef = useRef<HTMLCanvasElement>(null); // Renamed from individualTrialsLineChartRef
  const averageBarChartRef = useRef<HTMLCanvasElement>(null);
  const boxPlotChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstancesRef = useRef<{ averageLine?: Chart, averageBar?: Chart, boxPlot?: Chart }>({});

  const allValidTimes: number[] = useMemo(() => {
    const times: number[] = [];
    roundsData.forEach(round => {
      round.trials.forEach(trial => {
        if (trial.time !== null) {
          times.push(trial.time);
        }
      });
    });
    return times;
  }, [roundsData]);

  const overallStats = useMemo(() => calculateStats(allValidTimes), [allValidTimes]);

  const roundsWithStats = useMemo(() => {
    return roundsData.map(round => {
      const roundTimes = round.trials.filter(t => t.time !== null).map(t => t.time as number);
      return {
        ...round,
        stats: calculateStats(roundTimes),
        soundLevel: ROUND_SOUND_LEVELS[round.roundNumber - 1] || "N/A"
      };
    });
  }, [roundsData]);

  const orderedRoundsForChart = useMemo(() => {
    return CHART_ROUND_ORDER.map(roundNum =>
      roundsWithStats.find(r => r.roundNumber === roundNum)
    ).filter(Boolean) as (RoundData & { stats: StatValues, soundLevel: string })[];
  }, [roundsWithStats]);

  const chartDataLabels = useMemo(() => {
    return orderedRoundsForChart.map(orderedRound => {
      let label = orderedRound.soundLevel.match(/\((\d+dB)\)/)?.[1] || orderedRound.soundLevel.match(/(\d+dB)/)?.[1] || orderedRound.soundLevel;
      if (orderedRound.soundLevel.toLowerCase().includes("control")) {
        label = `Control (${label})`;
      }
      return label;
    });
  }, [orderedRoundsForChart]);


  useEffect(() => {
    if (!isDetailedView || !roundsData.length) return;

    Object.values(chartInstancesRef.current).forEach(chart => chart?.destroy());
    chartInstancesRef.current = {};

    const commonChartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: 'Reaction Time (ms)', font: { size: 14, family: 'Inter' } },
          grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { font: { size: 12, family: 'Inter' } }
        },
        x: {
          title: { display: true, text: 'Sound Condition', font: { size: 14, family: 'Inter' } },
          grid: { display: false },
          ticks: { font: { size: 12, family: 'Inter' } }
        }
      },
      plugins: {
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 14, family: 'Inter' },
          bodyFont: { size: 12, family: 'Inter' },
          padding: 10,
        }
      },
      animation: {
        duration: 500
      }
    };

    // 1. Average Reaction Time Line Chart with Error Band (SEM)
    if (averageLineChartRef.current) {
      const ctx = averageLineChartRef.current.getContext('2d');
      if (!ctx) return;

      const averages = orderedRoundsForChart.map(round => round.stats.average);
      const sems = orderedRoundsForChart.map(round => round.stats.sem);

      const dataWithErrors = averages.map((avg, i) => ({
        y: avg,
        yMin: avg - sems[i],
        yMax: avg + sems[i]
      }));

      chartInstancesRef.current.averageLine = new Chart(ctx, {
        type: LineWithErrorBarsController.id as 'line',
        data: {
          labels: chartDataLabels,
          datasets: [
            {
              label: 'Average Reaction Time',
              data: dataWithErrors,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgb(59, 130, 246)',
              borderWidth: 2,
              pointBackgroundColor: 'rgb(59, 130, 246)',
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.1
            }
          ]
        },
        options: {
          ...commonChartOptions,
          plugins: {
            ...commonChartOptions.plugins,
            title: {
              display: true,
              text: 'Average Reaction Time with Standard Error of Mean',
              font: { size: 16, weight: 'bold', family: 'Inter' },
              padding: { top: 10, bottom: 20 }
            },
            tooltip: {
              ...commonChartOptions.plugins.tooltip,
              callbacks: {
                label: (context: any) => {
                  const round = orderedRoundsForChart[context.dataIndex];
                  return [
                    `Average: ${round.stats.average.toFixed(SCORE_PRECISION)} ms`,
                    `SEM: ±${round.stats.sem.toFixed(SCORE_PRECISION)} ms`
                  ];
                }
              }
            },
            legend: {
              display: true,
              labels: {
                filter: (legendItem, _chartData) => legendItem.datasetIndex === 0
              }
            }
          },
          scales: {
            y: {
              ...commonChartOptions.scales.y,
              title: {
                display: true,
                text: 'Reaction Time (ms)'
              }
            },
            x: {
              ...commonChartOptions.scales.x,
              title: {
                display: true,
                text: 'Sound Condition'
              }
            }
          }
        }
      });
    }

    // 2. Average Performance Bar Chart
    if (averageBarChartRef.current) {
      const avgTimes = orderedRoundsForChart.map(r => r.stats.count > 0 ? r.stats.average : 0);
      chartInstancesRef.current.averageBar = new Chart(averageBarChartRef.current, {
        type: 'bar',
        data: {
          labels: chartDataLabels,
          datasets: [{
            label: 'Average Reaction Time',
            data: avgTimes,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
            borderRadius: 4,
          }]
        },
        options: {
          ...commonChartOptions,
          plugins: {
            ...commonChartOptions.plugins,
            title: { display: true, text: 'Average Reaction Time by Sound Condition', font: { size: 16, weight: 'bold', family: 'Inter' }, padding: { top: 10, bottom: 20 } },
            legend: { display: false },
            tooltip: {
              ...commonChartOptions.plugins.tooltip,
              callbacks: {
                label: (context: any) => `Mean: ${context.parsed.y?.toFixed(SCORE_PRECISION)} ms`
              }
            }
          }
        }
      });
    }

    // 3. Box Plot Chart
    if (boxPlotChartRef.current) {
      const boxPlotData = orderedRoundsForChart.map(round => {
        const times = round.trials.filter(t => t.time !== null).map(t => t.time as number);
        return times.length > 0 ? times : [];
      });
      chartInstancesRef.current.boxPlot = new Chart(boxPlotChartRef.current, {
        type: 'boxplot',
        data: {
          labels: chartDataLabels,
          datasets: [{
            label: 'Reaction Time Distribution',
            data: boxPlotData,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1,
            itemRadius: 3,
            itemStyle: 'circle',
            outlierStyle: 'circle',
            outlierRadius: 4,
            outlierBackgroundColor: 'rgba(255, 99, 132, 0.5)',
            // meanStyle: 'triangle', // Requires plugin extension or custom drawing
            // meanRadius: 5,
            // meanBackgroundColor: 'rgb(255,99,132)',
          }]
        },
        options: {
          ...commonChartOptions,
          plugins: {
            ...commonChartOptions.plugins,
            title: { display: true, text: 'Reaction Time Distribution by Sound Condition (Box Plot)', font: { size: 16, weight: 'bold', family: 'Inter' }, padding: { top: 10, bottom: 20 } },
            legend: { display: false },
            tooltip: {
              ...commonChartOptions.plugins.tooltip,
              callbacks: {
                label: (context: any): string | string[] => {
                  const stats = context.dataset.data[context.dataIndex];
                  // The boxplot plugin stores stats in _cache
                  const cachedStats = (context.dataset as any)._cache?.[context.dataIndex]?.stats;
                  if (cachedStats) {
                    return [
                      `Median: ${cachedStats.median.toFixed(SCORE_PRECISION)} ms`,
                      `Q1: ${cachedStats.q1.toFixed(SCORE_PRECISION)} ms`,
                      `Q3: ${cachedStats.q3.toFixed(SCORE_PRECISION)} ms`,
                      `Min: ${cachedStats.min.toFixed(SCORE_PRECISION)} ms`,
                      `Max: ${cachedStats.max.toFixed(SCORE_PRECISION)} ms`,
                      ...(cachedStats.outliers ? [`Outliers: ${cachedStats.outliers.length}`] : [])
                    ];
                  }
                  return 'No data';
                }
              }
            }
          },
        }
      });
    }

    return () => {
      Object.values(chartInstancesRef.current).forEach(chart => chart?.destroy());
      chartInstancesRef.current = {};
    };
  }, [isDetailedView, roundsData, roundsWithStats, orderedRoundsForChart, chartDataLabels]);

  const ChartHeader: React.FC<{ title: string; chartKey: keyof typeof chartInstancesRef.current, filenamePrefix: string }> = ({ title, chartKey, filenamePrefix }) => (
    <div className="flex justify-between items-center mb-1">
      <h4 className="text-md font-semibold text-slate-700">{title}</h4>
      <button
        onClick={() => downloadChartAsPng(chartInstancesRef.current[chartKey], `${filenamePrefix}_${sessionId.substring(0, 5)}.png`)}
        className="p-1.5 text-slate-500 hover:text-sky-600 transition-colors"
        title={`Download ${title} as PNG`}
        aria-label={`Download ${title} as PNG`}
      >
        <DownloadIcon className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="statistics-display p-6 md:p-8 bg-white rounded-lg shadow-xl w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-4 border-b border-slate-300 gap-3">
        <div>
          <h2 className="text-3xl font-bold text-sky-600">
            {isDetailedView ? 'Session Details' : 'Session Summary'}
          </h2>
          <p className="text-slate-600 text-sm">User: {user.name} ({user.sex})</p>
          <p className="text-slate-500 text-xs">
            Session ID: {sessionId} | Started: {new Date(startTime).toLocaleTimeString()}
            {endTime && ` | Ended: ${new Date(endTime).toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 items-start sm:items-center">
          {isDetailedView && (
            <>
              <button
                onClick={() => exportDetailedSessionToCsv(sessionData, overallStats, roundsWithStats)}
                className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                aria-label="Export this session's detailed data to CSV"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export to CSV
              </button>
              <button
                onClick={() => exportSessionToPdf(sessionData, overallStats, roundsWithStats)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                aria-label="Export this session's summary to PDF"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export to PDF
              </button>
            </>
          )}
          {isDetailedView && onBackToOverview ? (
            <button
              onClick={onBackToOverview}
              className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
              aria-label="Back to all sessions overview"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Overview
            </button>
          ) : !isDetailedView ? (
            <button
              onClick={onResetSession}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              aria-label="Start new user session"
            >
              <RefreshCcwIcon className="w-4 h-4 mr-2" />
              Start New User Session
            </button>
          ) : null}
        </div>
      </div>

      {overallStats.count > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-700 mb-3">Overall Performance Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
              <p className="text-sm text-slate-500">Average</p>
              <p className="text-2xl font-bold text-blue-500">{overallStats.average.toFixed(SCORE_PRECISION)} ms</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
              <p className="text-sm text-slate-500">Median</p>
              <p className="text-2xl font-bold text-purple-500">{overallStats.median.toFixed(SCORE_PRECISION)} ms</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
              <p className="text-sm text-slate-500">Best Trial</p>
              <p className="text-2xl font-bold text-green-500">{overallStats.best.toFixed(SCORE_PRECISION)} ms</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
              <p className="text-sm text-slate-500">Std. Deviation</p>
              <p className="text-2xl font-bold text-teal-500">{overallStats.stdDev.toFixed(SCORE_PRECISION)} ms</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
              <p className="text-sm text-slate-500">SEM (Overall)</p>
              <p className="text-2xl font-bold text-orange-500">{overallStats.sem.toFixed(SCORE_PRECISION)} ms</p>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-xl font-semibold text-slate-700 mb-4">Detailed Results by Round</h3>
      <div className="overflow-x-auto border border-slate-300 rounded-md mb-10">
        <table className="min-w-full divide-y divide-slate-300">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Round</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sound Level</th>
              {[...Array(TRIALS_PER_ROUND)].map((_, i) => (
                <th key={i} className="px-2 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">T{i + 1} (ms)</th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Avg (ms)</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">SD (ms)</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">SEM (ms)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {roundsWithStats.map((round) => (
              <tr key={round.roundNumber} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-slate-700"> {round.roundNumber}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600">{round.soundLevel}</td>
                {round.trials.map((trial: TrialScore) => (
                  <td key={trial.trialNumber} className="px-2 py-3 whitespace-nowrap text-sm text-center">
                    {trial.time !== null ? (
                      <span className="text-sky-700">{trial.time.toFixed(SCORE_PRECISION)}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-center font-medium">
                  {round.stats.count > 0 ?
                    <span className="text-indigo-600">{round.stats.average.toFixed(SCORE_PRECISION)}</span> :
                    <span className="text-slate-400">-</span>
                  }
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-center font-medium">
                  {round.stats.count > 1 ?
                    <span className="text-teal-600">{round.stats.stdDev.toFixed(SCORE_PRECISION)}</span> :
                    <span className="text-slate-400">-</span>
                  }
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-center font-medium">
                  {round.stats.count > 0 ?
                    <span className="text-orange-600">{round.stats.sem.toFixed(SCORE_PRECISION)}</span> :
                    <span className="text-slate-400">-</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isDetailedView && overallStats.count > 0 && (
        <>
          <div className="mt-10 pt-6 border-t border-slate-300">
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Notes on Data Analysis & Methodology</h3>
            <div className="prose prose-sm sm:prose-base max-w-none text-slate-600 space-y-2">
              <p>
                <strong>Data Collection:</strong> Reaction times were measured in milliseconds (ms) for {TRIALS_PER_ROUND} trials per round, across {TOTAL_ROUNDS} distinct sound conditions.
                The sound conditions were ordered by increasing perceived sound level for analysis: {chartDataLabels.join(', ')}.
              </p>
              <p>
                <strong>Statistical Summary:</strong> The table above provides descriptive statistics (Average, Standard Deviation (SD), Standard Error of the Mean (SEM)) for each round.
                Overall performance metrics across all valid trials are also displayed. SEM = SD / sqrt(N), where N is the number of trials.
              </p>
              <p>
                <strong>Further Analysis:</strong> The Mean, SD, SEM, and N for each round are key components for inferential statistical analysis (e.g., t-tests, ANOVA)
                to determine if observed differences in mean reaction times between conditions are statistically significant.
                Such analyses are typically performed using statistical software (e.g., R, SPSS, Python with Scipy/Statsmodels) or online calculators.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Data Visualizations</h3>
            <p className="text-sm text-slate-500 mb-6">
              Click the download icon next to each chart title to save it as a PNG image.
              Charts are rendered on a clean white background suitable for documents.
            </p>

            <div className="space-y-12">
              <div>
                <ChartHeader title="Average Reaction Time & SEM" chartKey="averageLine" filenamePrefix="avg_rt_sem_line_chart" />
                <div className="h-96 md:h-[450px] p-2 border border-slate-200 rounded-md shadow-sm bg-white">
                  <canvas ref={averageLineChartRef}></canvas>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Line Chart: Shows average reaction time per sound condition with an error band representing ±1 Standard Error of the Mean (SEM).</p>
              </div>
              <div>
                <ChartHeader title="Average Reaction Time (Bar)" chartKey="averageBar" filenamePrefix="avg_rt_bar_chart" />
                <div className="h-80 md:h-96 p-2 border border-slate-200 rounded-md shadow-sm bg-white">
                  <canvas ref={averageBarChartRef}></canvas>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Bar Chart: Displays average reaction times for each sound condition.</p>
              </div>
              <div>
                <ChartHeader title="Reaction Time Distribution (Box Plot)" chartKey="boxPlot" filenamePrefix="rt_distribution_boxplot" />
                <div className="h-96 md:h-[450px] p-2 border border-slate-200 rounded-md shadow-sm bg-white">
                  <canvas ref={boxPlotChartRef}></canvas>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Box Plot: Illustrates the distribution (median, quartiles, range, outliers) of reaction times for each sound condition.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-8 text-center">
              Sound conditions on charts are ordered by increasing perceived sound level: {chartDataLabels.join(', ')}.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-300">
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Interpreting Your Data: Example Insights</h3>
            <div className="prose prose-sm sm:prose-base max-w-none text-slate-600 space-y-3">
              <p>
                <strong>Consistency of Performance:</strong> Look at the Standard Deviation (SD) and Standard Error of the Mean (SEM) in the "Detailed Results by Round" table. A lower SD/SEM suggests more consistent reaction times within that round.
                The Box Plots also visually represent variability: a shorter box and shorter whiskers indicate less spread in data. The error band on the line chart (representing SEM) also indicates precision of the mean.
              </p>
              <p>
                <strong>Impact of Sound Levels:</strong> Compare average reaction times across conditions using the Line Chart (with SEM bands) and Bar Chart.
                Box Plots help see if the median reaction time shifts significantly and how the overall distribution changes.
              </p>
              <p>
                <strong>Outliers and Extreme Values:</strong> The Box Plot is excellent for identifying outliers.
              </p>
              <p>
                <strong>Example Finding (Hypothetical):</strong> "The 70 dB condition (Round 3) showed the average reaction time of M = {
                  roundsWithStats.find(r => r.roundNumber === 3)?.stats.average.toFixed(SCORE_PRECISION) || 'X.XX'
                } ms, SEM = {
                  roundsWithStats.find(r => r.roundNumber === 3)?.stats.sem.toFixed(SCORE_PRECISION) || 'Y.YY'
                } ms. The SEM indicates the precision of this mean. The Box Plot for this condition displays a relatively compact interquartile range."
                (Note: Replace the example values with actual data from your session).
              </p>
            </div>
          </div>
        </>
      )}

      {overallStats.count === 0 && (
        <p className="text-slate-500 mt-6 text-center">No successful trials recorded in this session.</p>
      )}
    </div>
  );
};

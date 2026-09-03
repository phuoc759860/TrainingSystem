import { useRef, useEffect, useMemo } from "react";
import Highcharts from "highcharts";
import { scoreColorHc, applyHcTheme } from "./hcTheme";

applyHcTheme();

/**
 * HcBarChart — horizontal bar chart with gradient fills, average reference line,
 * score-based coloring, and Highcharts-style HTML tooltips.
 *
 * Props:
 *   data        – [{ name, score, fullName? }]
 *   height      – number (px)
 *   max         – x-axis max (default 100)
 *   unit        – tooltip suffix (default "%")
 *   barSize     – bar thickness in px (default 20)
 *   showLabels  – show data-label percentages on bars
 *   showAverage – show a dashed average reference line
 *   id          – chart container id
 */
export default function HcBarChart({
    data = [],
    height = 300,
    max = 100,
    unit = "%",
    barSize = 20,
    showLabels = true,
    showAverage = false,
    id,
}) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    const categories = useMemo(() => data.map((d) => d.name), [data]);
    const values = useMemo(() => data.map((d) => d.score), [data]);
    const colors = useMemo(() => data.map((d) => scoreColorHc(d.score)), [data]);
    const average = useMemo(() => {
        if (values.length === 0) return 0;
        return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
    }, [values]);

    useEffect(() => {
        if (!containerRef.current) return;

        const plotBands = showAverage && average > 0
            ? [{
                  from: average - 0.5,
                  to: average + 0.5,
                  color: "rgba(37,99,235,.08)",
                  label: {
                      text: `Avg ${average}${unit}`,
                      style: { fontSize: "11px", fontWeight: "600", color: "#2563eb" },
                      align: "left",
                      x: 4,
                  },
                  zIndex: 0,
              }]
            : [];

        const plotLines = showAverage && average > 0
            ? [{
                  value: average,
                  color: "rgba(37,99,235,.45)",
                  width: 2,
                  dashStyle: "Dash",
                  zIndex: 3,
                  label: {
                      text: "",
                  },
              }]
            : [];

        chartRef.current = Highcharts.chart(containerRef.current, {
            chart: {
                type: "bar",
                height,
                marginLeft: 8,
                marginRight: 30,
                spacing: [4, 4, 4, 4],
                backgroundColor: "transparent",
            },
            xAxis: {
                categories,
                title: { text: null },
                gridLineWidth: 0,
                lineWidth: 0,
                plotBands,
            },
            yAxis: {
                min: 0,
                max,
                title: { text: null },
                labels: { overflow: "justify", style: { fontSize: "11px" } },
                gridLineWidth: 1,
                gridLineDashStyle: "Dot",
                gridLineColor: "rgba(235,235,243,.6)",
                plotLines,
            },
            tooltip: {
                headerFormat:
                    '<div style="display:flex;gap:8px;align-items:flex-start"><div style="display:flex;flex-direction:column;gap:1px"><svg width="3" height="28"><rect width="3" height="28" rx="1.5" fill="{point.color}"/></svg></div><div><div style="font-weight:700;font-size:13px;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #e2e8f0">{point.key}</div>',
                pointFormat:
                    '<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-size:12px;color:#64748b">Average Score</span><span style="font-weight:700;font-family:Inter,sans-serif;padding-left:4px">{point.y}' +
                    unit +
                    "</span></div>",
                footerFormat: "</div></div>",
                useHTML: true,
                backgroundColor: "rgba(255,255,255,.95)",
                borderColor: "#e2e8f0",
                borderRadius: 10,
                shadow: { color: "rgba(16,18,42,.1)", offsetX: 0, offsetY: 4, width: 16 },
                style: { fontSize: "13px", color: "#0f172a" },
            },
            plotOptions: {
                bar: {
                    borderRadius: 5,
                    pointPadding: 0.08,
                    groupPadding: 0.06,
                    borderWidth: 0,
                    pointWidth: barSize,
                    colorByPoint: true,
                    dataLabels: showLabels
                        ? {
                              enabled: true,
                              format: `{y}${unit}`,
                              style: {
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#0f172a",
                                  textOutline: "none",
                              },
                              align: "left",
                              x: 6,
                          }
                        : { enabled: false },
                    states: {
                        hover: { brightness: 0.08 },
                    },
                },
            },
            legend: { enabled: false },
            credits: { enabled: false },
            series: [
                {
                    name: "Average Score",
                    data: values.map((v, i) => ({
                        y: v,
                        color: {
                            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
                            stops: [
                                [0, Highcharts.color(colors[i]).setOpacity(0.7).get("rgba")],
                                [1, colors[i]],
                            ],
                        },
                    })),
                    animation: { duration: 1000, easing: "easeInOutSine" },
                },
            ],
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [categories, values, colors, height, max, unit, barSize, showLabels, showAverage, average]);

    return <div ref={containerRef} id={id} style={{ width: "100%", height }} />;
}

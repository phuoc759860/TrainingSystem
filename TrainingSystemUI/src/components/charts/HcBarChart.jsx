import { useRef, useEffect, useMemo } from "react";
import Highcharts from "highcharts";
import { scoreColorHc, applyHcTheme } from "./hcTheme";

applyHcTheme();

export default function HcBarChart({
    data = [],
    height = 300,
    max = 100,
    unit = "%",
    barSize = 20,
    showLabels = true,
    id,
}) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    const categories = useMemo(() => data.map((d) => d.name), [data]);
    const values = useMemo(() => data.map((d) => d.score), [data]);
    const colors = useMemo(() => data.map((d) => scoreColorHc(d.score)), [data]);

    useEffect(() => {
        if (!containerRef.current) return;

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
            },
            yAxis: {
                min: 0,
                max,
                title: { text: null },
                labels: { overflow: "justify" },
                gridLineWidth: 1,
            },
            tooltip: {
                headerFormat:
                    '<div style="display:flex;gap:8px;align-items:flex-start"><div style="display:flex;flex-direction:column;gap:1px"><svg width="3" height="28"><rect width="3" height="28" rx="1.5" fill="{point.color}"/></svg></div><div><div style="font-weight:700;font-size:13px;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #ebebf3">{point.key}</div>',
                pointFormat:
                    '<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-size:12px;color:#525878">Average Score</span><span style="font-weight:700;font-family:Sora,Inter,sans-serif;padding-left:4px">{point.y}' +
                    unit +
                    "</span></div>",
                footerFormat: "</div></div>",
                useHTML: true,
                backgroundColor: "#ffffff",
                borderColor: "#ebebf3",
                borderRadius: 10,
                shadow: { color: "rgba(0,0,0,.12)", offsetX: 0, offsetY: 4, width: 20 },
                style: { fontSize: "13px", color: "#10122a" },
            },
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    pointPadding: 0.1,
                    groupPadding: 0.08,
                    borderWidth: 0,
                    pointWidth: barSize,
                    dataLabels: showLabels
                        ? {
                              enabled: true,
                              format: `{y}${unit}`,
                              style: {
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#10122a",
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
                        color: colors[i],
                    })),
                    animation: { duration: 1000 },
                },
            ],
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [categories, values, colors, height, max, unit, barSize, showLabels]);

    return <div ref={containerRef} id={id} style={{ width: "100%", height }} />;
}

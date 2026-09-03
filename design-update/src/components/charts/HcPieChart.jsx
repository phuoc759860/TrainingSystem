import { useRef, useEffect, useMemo } from "react";
import Highcharts from "highcharts";
import { applyHcTheme } from "./hcTheme";

applyHcTheme();

/**
 * HcPieChart — donut chart with center label, percentage data labels,
 * responsive legend, and Highcharts-style HTML tooltips.
 *
 * Props:
 *   data       – [{ name, value, color?, fill? }]
 *   height     – number (px)
 *   unit       – tooltip suffix (default "")
 *   centerText – text to show in the center of the donut (e.g. total count)
 *   id         – chart container id
 */
export default function HcPieChart({
    data = [],
    height = 300,
    unit = "",
    centerText,
    id,
}) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    const seriesData = useMemo(
        () =>
            data.map((d) => ({
                name: d.name,
                y: d.value,
                color: d.color || d.fill,
            })),
        [data]
    );

    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    useEffect(() => {
        if (!containerRef.current) return;

        const displayCenter = centerText != null ? centerText : total;

        chartRef.current = Highcharts.chart(containerRef.current, {
            chart: {
                type: "pie",
                height,
                backgroundColor: "transparent",
            },
            tooltip: {
                headerFormat: "",
                pointFormat:
                    '<div style="display:flex;align-items:center;gap:8px;padding:2px 0"><span style="color:{point.color};font-size:14px">●</span><div><div style="font-weight:700;font-size:13px">{point.name}</div><div style="font-size:12px;color:#64748b;margin-top:2px">{point.y}' +
                    unit +
                    ' <span style="color:#9ca3af">({point.percentage:.1f}%)</span></div></div></div>',
                useHTML: true,
                backgroundColor: "rgba(255,255,255,.95)",
                borderColor: "#e2e8f0",
                borderRadius: 10,
                shadow: { color: "rgba(16,18,42,.1)", offsetX: 0, offsetY: 4, width: 16 },
                style: { fontSize: "13px", color: "#0f172a" },
            },
            plotOptions: {
                pie: {
                    innerSize: "62%",
                    borderWidth: 0,
                    cursor: "pointer",
                    dataLabels: {
                        enabled: true,
                        format: "<b>{point.name}</b><br/>{point.percentage:.1f}%",
                        style: {
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#64748b",
                            textOutline: "none",
                        },
                        distance: 18,
                        connectorWidth: 1,
                        connectorColor: "#d1d5db",
                    },
                    showInLegend: true,
                    states: {
                        hover: {
                            halo: { size: 8, opacity: 0.2 },
                            brightness: 0.05,
                        },
                    },
                    animation: { duration: 1200, easing: "easeInOutSine" },
                },
            },
            legend: {
                enabled: true,
                layout: "vertical",
                align: "right",
                verticalAlign: "middle",
                itemMarginBottom: 6,
                itemStyle: { fontSize: "12px", fontWeight: "600", color: "#64748b" },
                itemHoverStyle: { color: "#0f172a" },
                symbolRadius: 6,
                symbolHeight: 10,
                symbolWidth: 10,
            },
            responsive: {
                rules: [
                    {
                        condition: { maxWidth: 400 },
                        chartOptions: {
                            legend: {
                                layout: "horizontal",
                                align: "center",
                                verticalAlign: "bottom",
                            },
                        },
                    },
                ],
            },
            credits: { enabled: false },
            series: [
                {
                    name: "Students",
                    data: seriesData,
                },
            ],
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [seriesData, height, unit, centerText, total]);

    return (
        <div ref={containerRef} id={id} style={{ width: "100%", height, position: "relative" }}>
            {centerText != null && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "38%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                >
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", fontFamily: "Inter, sans-serif", lineHeight: 1.1 }}>
                        {displayCenter}
                    </div>
                </div>
            )}
        </div>
    );
}

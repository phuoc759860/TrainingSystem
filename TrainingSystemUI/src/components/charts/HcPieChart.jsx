import { useRef, useEffect, useMemo } from "react";
import Highcharts from "highcharts";
import { applyHcTheme } from "./hcTheme";

applyHcTheme();

export default function HcPieChart({
    data = [],
    height = 300,
    unit = "",
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

    useEffect(() => {
        if (!containerRef.current) return;

        chartRef.current = Highcharts.chart(containerRef.current, {
            chart: {
                type: "pie",
                height,
                backgroundColor: "transparent",
            },
            tooltip: {
                headerFormat: "",
                pointFormat:
                    '<span style="color:{point.color};font-size:14px">●</span> <b>{point.name}</b>: <b>{point.y}' +
                    unit +
                    "</b>",
                useHTML: true,
                backgroundColor: "#ffffff",
                borderColor: "#ebebf3",
                borderRadius: 10,
                shadow: { color: "rgba(0,0,0,.12)", offsetX: 0, offsetY: 4, width: 20 },
                style: { fontSize: "13px", color: "#10122a" },
            },
            plotOptions: {
                pie: {
                    innerSize: "60%",
                    borderWidth: 0,
                    cursor: "pointer",
                    dataLabels: {
                        enabled: true,
                        format: "<b>{point.name}</b>: {point.y}" + unit,
                        style: {
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#10122a",
                            textOutline: "none",
                        },
                        distance: 20,
                    },
                    showInLegend: true,
                    states: {
                        hover: {
                            halo: { size: 8, opacity: 0.25 },
                            brightness: 0.05,
                        },
                    },
                    animation: { duration: 1200 },
                },
            },
            legend: {
                enabled: true,
                layout: "vertical",
                align: "right",
                verticalAlign: "middle",
                itemMarginBottom: 6,
                itemStyle: { fontSize: "12px", fontWeight: "600", color: "#525878" },
                symbolRadius: 6,
                symbolHeight: 10,
                symbolWidth: 10,
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
    }, [seriesData, height, unit]);

    return <div ref={containerRef} id={id} style={{ width: "100%", height }} />;
}

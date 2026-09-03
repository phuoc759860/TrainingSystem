import Highcharts from "highcharts";

const BRAND = "#2563eb";
const BRAND_LIGHT = "#60a5fa";
const SUCCESS = "#17a668";
const DANGER = "#e34a4a";
const INK = "#0f172a";
const INK_SOFT = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#ffffff";

export function scoreColorHc(value) {
    if (value >= 70) return SUCCESS;
    if (value >= 50) return BRAND;
    return DANGER;
}

let themeApplied = false;

export function applyHcTheme() {
    if (themeApplied) return;
    themeApplied = true;

    Highcharts.setOptions({
        chart: {
            style: { fontFamily: "'Open Sans', system-ui, 'Segoe UI', Roboto, sans-serif" },
            backgroundColor: "transparent",
            spacing: [10, 10, 10, 10],
            animation: { duration: 1000, easing: "easeInOutSine" },
        },
        title: { text: null },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
            gridLineColor: "rgba(226,232,240,.5)",
            lineColor: BORDER,
            tickColor: BORDER,
            labels: { style: { color: INK_SOFT, fontSize: "12px" } },
            title: { style: { color: INK_SOFT } },
        },
        yAxis: {
            gridLineColor: "rgba(226,232,240,.5)",
            gridLineDashStyle: "Dash",
            labels: { style: { color: INK_SOFT, fontSize: "12px" } },
            title: { style: { color: INK_SOFT } },
        },
        tooltip: {
            useHTML: true,
            backgroundColor: "rgba(255,255,255,.95)",
            borderColor: BORDER,
            borderRadius: 10,
            shadow: { color: "rgba(16,18,42,.1)", offsetX: 0, offsetY: 4, width: 16 },
            style: { fontSize: "13px", color: INK },
            headerFormat: '<div style="display:flex;gap:8px;align-items:flex-start"><div style="display:flex;flex-direction:column;gap:1px"><svg width="3" height="28"><rect width="3" height="28" rx="1.5" fill="{series.color}"/></svg></div><div><div style="font-weight:700;font-size:13px;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid ' + BORDER + '">{point.key}</div>',
            pointFormat: '<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-size:12px;color:' + INK_SOFT + '">{series.name}</span><span style="font-weight:700;font-family:Inter,sans-serif;padding-left:4px">{point.y}</span></div>',
            footerFormat: "</div></div>",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                pointPadding: 0.15,
                groupPadding: 0.1,
                borderWidth: 0,
                dataLabels: { enabled: false },
                states: {
                    hover: {
                        brightness: 0.08,
                        shadow: { color: "rgba(0,0,0,.12)", offsetX: 0, offsetY: 2, width: 6 },
                    },
                },
            },
            pie: {
                allowPointSelect: true,
                cursor: "pointer",
                borderWidth: 0,
                shadow: false,
                states: {
                    hover: {
                        halo: { size: 8, opacity: 0.2 },
                        brightness: 0.05,
                    },
                },
            },
            series: {
                animation: { duration: 1000, easing: "easeInOutSine" },
            },
        },
    });
}

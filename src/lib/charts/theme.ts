/**
 * Shared Chart.js theming for the eDMS dashboards.
 *
 * Chart.js draws to a canvas, so it cannot inherit the CSS custom properties in
 * `app.css`. The neutral tokens below are the concrete equivalents of that file's
 * `--card` / `--border` / `--muted-foreground` values; the series hues are a
 * validated categorical palette (adjacent CVD deltaE >= 8 in both modes).
 */

export type Mode = 'light' | 'dark';

/** Categorical slots, assigned in fixed order and never cycled. */
const SERIES: Record<Mode, string[]> = {
	light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'],
	dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181']
};

export type ChartTheme = {
	mode: Mode;
	/** Categorical hues, in slot order. */
	series: string[];
	/** Single-series / emphasis hue (slot 1). */
	accent: string;
	/** The card the canvas sits on — also the colour of the gaps between marks. */
	surface: string;
	grid: string;
	ink: string;
	muted: string;
	tooltipBg: string;
	tooltipInk: string;
	tooltipMuted: string;
};

const THEMES: Record<Mode, ChartTheme> = {
	light: {
		mode: 'light',
		series: SERIES.light,
		accent: SERIES.light[0],
		surface: '#ffffff',
		grid: '#f0f0f0',
		ink: '#262626',
		muted: '#8a8a8a',
		tooltipBg: '#171717',
		tooltipInk: '#fafafa',
		tooltipMuted: '#a3a3a3'
	},
	dark: {
		mode: 'dark',
		series: SERIES.dark,
		accent: SERIES.dark[0],
		surface: '#171717',
		grid: 'rgba(255,255,255,0.08)',
		ink: '#fafafa',
		muted: '#a3a3a3',
		tooltipBg: '#fafafa',
		tooltipInk: '#171717',
		tooltipMuted: '#525252'
	}
};

export const FONT_FAMILY = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";

/**
 * The `dark` class on `<html>` is the single source of truth — `$lib/theme`
 * resolves the light/dark/system preference and stamps it there, and `app.css`
 * keys its own `dark` variant off the same class. Reading `prefers-color-scheme`
 * here as well would let the canvas disagree with the page whenever someone
 * explicitly picks light on an OS set to dark.
 */
export function currentMode(): Mode {
	if (typeof document === 'undefined') return 'light';
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function chartTheme(mode: Mode = currentMode()): ChartTheme {
	return THEMES[mode];
}

/** Calls `cb` whenever the resolved mode changes. Returns an unsubscribe fn. */
export function onModeChange(cb: (mode: Mode) => void): () => void {
	if (typeof document === 'undefined') return () => {};
	let last = currentMode();
	const observer = new MutationObserver(() => {
		const next = currentMode();
		if (next !== last) {
			last = next;
			cb(next);
		}
	});
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	return () => observer.disconnect();
}

/** `#rrggbb` -> `rgba(r,g,b,alpha)`. */
export function withAlpha(hex: string, alpha: number): string {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Vertical wash under a line: the series hue fading out toward the baseline. */
export function areaGradient(
	ctx: CanvasRenderingContext2D,
	area: { top: number; bottom: number },
	hex: string
): CanvasGradient {
	const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
	g.addColorStop(0, withAlpha(hex, 0.18));
	g.addColorStop(0.6, withAlpha(hex, 0.05));
	g.addColorStop(1, withAlpha(hex, 0));
	return g;
}

/** Compact axis/tooltip number formatting: 1248 -> "1,248", 12900 -> "12.9K". */
export function compact(value: number): string {
	if (Math.abs(value) >= 10_000) {
		return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
	}
	return value.toLocaleString();
}

/** Tooltip options shared by every chart on the dashboard. */
export function tooltipStyle(t: ChartTheme) {
	return {
		backgroundColor: t.tooltipBg,
		titleColor: t.tooltipMuted,
		bodyColor: t.tooltipInk,
		titleFont: { family: FONT_FAMILY, size: 11, weight: 500 as const },
		bodyFont: { family: FONT_FAMILY, size: 13, weight: 600 as const },
		padding: { top: 8, right: 12, bottom: 10, left: 12 },
		cornerRadius: 8,
		displayColors: true,
		boxWidth: 8,
		boxHeight: 8,
		boxPadding: 6,
		usePointStyle: true,
		caretSize: 0,
		caretPadding: 10
	};
}

export function axisTicks(t: ChartTheme, extra: Record<string, unknown> = {}) {
	return {
		color: t.muted,
		font: { family: FONT_FAMILY, size: 11, weight: 500 as const },
		padding: 8,
		...extra
	};
}

/**
 * A hairline dropped from the hovered point to the baseline — the crosshair that
 * makes a sparse line chart readable without labelling every point.
 */
export const crosshairPlugin = {
	id: 'edmsCrosshair',
	afterDatasetsDraw(chart: any, _args: unknown, opts: { color?: string }) {
		const active = chart.getActiveElements?.();
		if (!active?.length) return;
		const { ctx, chartArea } = chart;
		const x = active[0].element.x;
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(x, chartArea.top);
		ctx.lineTo(x, chartArea.bottom);
		ctx.lineWidth = 1;
		ctx.strokeStyle = opts?.color ?? 'rgba(0,0,0,0.12)';
		ctx.stroke();
		ctx.restore();
	}
};

/** Total + caption stacked in the hole of a doughnut. */
export const doughnutCenterPlugin = {
	id: 'edmsDoughnutCenter',
	afterDraw(chart: any, _args: unknown, opts: { value?: string; label?: string; ink?: string; muted?: string }) {
		if (!opts?.value) return;
		const { ctx, chartArea } = chart;
		const cx = (chartArea.left + chartArea.right) / 2;
		const cy = (chartArea.top + chartArea.bottom) / 2;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = opts.ink ?? '#262626';
		ctx.font = `600 22px ${FONT_FAMILY}`;
		ctx.fillText(opts.value, cx, cy - 6);
		if (opts.label) {
			ctx.fillStyle = opts.muted ?? '#8a8a8a';
			ctx.font = `500 10px ${FONT_FAMILY}`;
			ctx.fillText(opts.label.toUpperCase(), cx, cy + 13);
		}
		ctx.restore();
	}
};

/** Values set just past the tip of each horizontal bar. */
export const barValueLabelPlugin = {
	id: 'edmsBarValueLabel',
	afterDatasetsDraw(chart: any, _args: unknown, opts: { color?: string }) {
		const { ctx } = chart;
		const meta = chart.getDatasetMeta(0);
		ctx.save();
		ctx.fillStyle = opts?.color ?? '#262626';
		ctx.font = `600 11px ${FONT_FAMILY}`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		meta.data.forEach((bar: any, i: number) => {
			const raw = chart.data.datasets[0].data[i] as number;
			ctx.fillText(compact(raw), bar.x + 8, bar.y);
		});
		ctx.restore();
	}
};

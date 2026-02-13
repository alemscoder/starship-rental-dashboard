import { html, render } from "lit-html"
import { observeAndRender } from "@utils/observe-and-render.ts"
import * as echarts from "echarts"
import type { RadioGroupValueChangedEvent } from "@vaadin/radio-group"
import "@styles/dashboard.css"

export class Dashboard {

	static #instance: Dashboard
	#radioGroupValue: string | undefined
	protected chartInstance: echarts.ECharts | null = null
	protected resizeObserver: ResizeObserver | null = null

	protected statisticsData = {
		day: {
			tickets:   { count: 57,  percent: 4.1 },
			customers: { count: 19,  percent: -1.8 },
			invoices:  { count: 46,  percent: -3.2 }
		},
		week: {
			tickets:   { count: 382, percent: -2.6 },
			customers: { count: 131, percent: 5.4 },
			invoices:  { count: 311, percent: -1.9 }
		},
		month: {
			tickets:   { count: 1548, percent: 7.1 },
			customers: { count: 529,  percent: 4.3 },
			invoices:  { count: 1274, percent: -2.4 }
		}
	}

	protected chartData = {
		day: {
			xAxis: ["0h", "4h", "8h", "12h", "16h", "20h"],
			tickets:   [3, 5, 12, 18, 13, 6], // total = 57
			customers: [1, 2, 5, 6, 4, 1],  // total = 19
			invoices:  [2, 4, 10, 14, 11, 5] // total = 46
		},
		week: {
			xAxis: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			tickets:   [52, 60, 64, 63, 59, 50, 34], // total = 382
			customers: [18, 20, 21, 22, 20, 18, 12], // total = 131
			invoices:  [41, 46, 48, 47, 45, 41, 23], // total = 311
		},
		month: {
			xAxis: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
			tickets: [
				46, 48, 51, 52, 53, 47, 44, // Semana 1
				50, 56, 59, 60, 58, 49, 45, // Semana 2
				52, 54, 57, 59, 61, 56, 48, // Semana 3
				53, 58, 63, 65, 67, 62, 55, // Semana 4
				56, 60 // últimos días (cierre)
			], // total 1548 exacto
			customers: [
				15, 16, 17, 18, 18, 16, 14,
				17, 19, 21, 22, 21, 18, 16,
				19, 20, 22, 23, 24, 22, 18,
				20, 23, 25, 26, 27, 25, 22,
				23, 25
			], // total 529 exacto
			invoices: [
				35, 36, 38, 40, 41, 38, 34,
				37, 42, 44, 45, 44, 39, 36,
				41, 43, 45, 47, 48, 45, 40,
				43, 47, 50, 52, 54, 51, 47,
				48, 50
			] // total 1274 exacto
		}
	}

	constructor() {
		if (!!Dashboard.#instance) {
			return Dashboard.#instance
		}
		Dashboard.#instance = this
	}

	static getInstance() {
		if (!Dashboard.#instance) {
			new Dashboard()
		}
		return Dashboard.#instance
	}

	protected set radioGroupValue(value: string | undefined) {
		this.#radioGroupValue = value
		this.statisticsCardRenderer()
	}

	protected get radioGroupValue() {
		return this.#radioGroupValue
	}

	protected getRadioGroupValue = (event: RadioGroupValueChangedEvent) => {
		const value = event.detail.value
		if (value === "day" || value === "week" || value === "month") {
			this.radioGroupValue = value
		}
	}

	protected statisticsCardTemplate = (
		cardName: string,
		cardNumber: number,
		cardPercent: number,
		iconTheme: string,
		iconPath: string,
		urlPath: string,
	) => {
		const isNegative = cardPercent < 0
		const percentAbs = Math.abs(cardPercent)
		const trendIcon = isNegative ? "/arrow-down.svg" : "/arrow-up.svg"
		const trendColor = isNegative ? "text-error" : "text-success"
		return html`
			<div
				class="flex bg-transparent px-m py-s items-center gap-x-m gap-y-m relative flex-grow"
				style="flex-basis: 0px;"
			>
				<div class="flex">
					<div
						class="flex bg-${iconTheme}-10 rounded-full h-xl text-${iconTheme} w-xl items-center justify-center"
					>
						<vaadin-icon src=${iconPath} class="h-m w-m"></vaadin-icon>
					</div>
				</div>
				<div class="flex py-xs flex-col flex-grow">
					<h3 class="text-s font-normal text-secondary">${cardName}</h3>
					<span class="font-medium text-xl">${cardNumber}</span>
					<div class="flex flex-wrap gap-x-s gap-y-s">
						<span class="items-center flex text-s gap-s ${trendColor}">
							<div class="flex items-center gap-xs">
								<vaadin-icon src="${trendIcon}"></vaadin-icon>
								<div>
									${percentAbs}%
									<span class="text-secondary">
										from last ${this.radioGroupValue || "day"}
									</span>
								</div>
							</div>
						</span>
					</div>
				</div>
				<div class="flex">
					<a
						class="items-center flex h-m justify-center w-m"
						href=${urlPath}
						title=${cardName}
						aria-label=${cardName}
					>
						<vaadin-icon src="/chevron-right.svg" class="text-secondary"></vaadin-icon>
					</a>
				</div>
			</div>
		`
	}

	protected statisticsCardRenderer = () => {
		const statsCards = document.querySelector("#statsCards") as HTMLElement
		if (!statsCards) return
		const range = this.radioGroupValue ?? "day"
		const data = this.statisticsData[range as keyof typeof this.statisticsData]
		render(
			html`
				${this.statisticsCardTemplate(
					"Tickets",
					data.tickets.count,
					data.tickets.percent,
					"primary",
					"/ticket.svg",
					"/rentals/tickets",
				)}
				${this.statisticsCardTemplate(
					"Customers",
					data.customers.count,
					data.customers.percent,
					"success",
					"/user.svg",
					"/rentals/customers",
				)}
				${this.statisticsCardTemplate(
					"Invoices",
					data.invoices.count,
					data.invoices.percent,
					"warning",
					"/invoice.svg",
					"/rentals/invoices",
				)}
			`,
			statsCards,
		)
		this.statisticsChartRenderer()
	}

	protected statisticsChartRenderer() {
		const statsChart = document.querySelector("#statsChart") as HTMLElement
		if (!statsChart) return
		if (!this.chartInstance) {
			this.chartInstance = echarts.init(statsChart)
			this.resizeObserver = new ResizeObserver(() => {
				this.chartInstance?.resize()
			})
			this.resizeObserver.observe(statsChart)
		}
		const range = this.radioGroupValue ?? "day"
		const data = this.chartData[range as keyof typeof this.chartData]
		const option: echarts.EChartsOption = {
			animationDuration: 1000,
			backgroundColor: "transparent",
			tooltip: { 
				trigger: "axis",
			},
			legend: {
				data: ['Tickets', 'Customers', 'Invoices'],
				bottom: 0
			},
			xAxis: {
				type: "category",
				data: data.xAxis,
				axisLine: { lineStyle: { color: "#aaa" } },
				animation: false,
			},
			yAxis: {
				type: "value",
				axisLine: { show: false },
				splitLine: { lineStyle: { color: "#eee" } },
				animation: false,
			},
			series: [
				{
					name: "Tickets",
					type: "line",
					smooth: true,
					data: data.tickets,
					symbol: "circle",
					symbolSize: 6,
					lineStyle: { width: 3, color: '#1976d2' },
					itemStyle: { color: '#1976d2' },
					areaStyle: { opacity: 0.2, color: '#1976d2' },
					animation: true,
				},
				{
					name: "Customers",
					type: "line",
					smooth: true,
					data: data.customers,
					symbol: "circle",
					symbolSize: 6,
					lineStyle: { width: 3, color: '#2e7d32' },
					itemStyle: { color: '#2e7d32' },
					areaStyle: { opacity: 0.2, color: '#2e7d32' },
					animation: true,
				},
				{
					name: "Invoices",
					type: "line",
					smooth: true,
					data: data.invoices,
					symbol: "circle",
					symbolSize: 6,
					lineStyle: { width: 3, color: '#f57c00' },
					itemStyle: { color: '#f57c00' },
					areaStyle: { opacity: 0.2, color: '#f57c00' },
					animation: true,
				},
			],
		}
		this.chartInstance.setOption(option, {
			notMerge: false,
			replaceMerge: ['series', 'xAxis']
		})
	}

	public destroyChart() {
		this.resizeObserver?.disconnect()
		this.resizeObserver = null
		this.chartInstance?.dispose()
		this.chartInstance = null
	}

	protected template() {
		return html`
			<vaadin-scroller  theme="overflow-indicators">
				<div class="flex mx-auto max-w-screen-lg px-l box-border flex-col gap-x-l gap-y-l">
					<div>
						<h2>Dashboard Overview</h2>
						<p class="mb-0 text-secondary">
							Real-time statistics and historical trends for tickets, customers, and invoices.
						</p>
					</div>
					<vaadin-radio-group 
						@value-changed=${this.getRadioGroupValue} 
						theme="toggle" 
						aria-label="Duration">
						<vaadin-radio-button checked value="day" label="1 day"></vaadin-radio-button>
						<vaadin-radio-button value="week" label="1 week"></vaadin-radio-button>
						<vaadin-radio-button value="month" label="1 month"></vaadin-radio-button>
					</vaadin-radio-group>
					<section aria-label="statistics">
						<div
							id="statsCards" 
							class="w-full flex md:flex-row flex-col flex-wrap overflow-hidden border border-contrast-30 rounded-l md:divide-x">
						</div>
						<div 
							id="statsChart"
							style="width:100%;height:300px;">
						</div>
					</section>
				</div>
			</vaadin-scroller>
		`
	}

	public render() {
		observeAndRender({
			template: this.template(),
			targetSelector: ".View-container",
			renderOptions: { host: this },
		})
	}
}

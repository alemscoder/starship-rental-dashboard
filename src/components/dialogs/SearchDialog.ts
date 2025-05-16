import { html } from "lit-html"
import { DialogBase } from "@base/dialogs/DialogBase.ts"
import { dialogHeaderRenderer, dialogRenderer } from "@vaadin/dialog/lit.js"
import "@styles/search-dialog.css"

export class SearchDialog extends DialogBase {

	constructor() {
		super("vaadin-button#searchButton")
	}

	protected getDialogId() {
		return "#searchDialog"
	}

	protected getDialogClass() {
		return "command-palette"
	}

	protected renderHeader = () => html`
		<vaadin-text-field class="flex" placeholder="Search or type a command">
			<vaadin-icon slot="prefix" src="/search.svg"></vaadin-icon>
			<span class="key" slot="suffix">^K</span>
		</vaadin-text-field>
	`

	protected renderDialog = () => {
		return html`
			<div class="command-palette-suggestions pb-s pt-m">
				<h4 class="text-xs font-bold text-secondary flex gap-s items-center leading-xs ai-prompts ms-m">
					<vaadin-icon src="/ai.svg">
					</vaadin-icon>
					AI Prompts
				</h4>
				<ul class="flex flex-col list-none m-0 my-s p-0">
					<li>
						<vaadin-button>
							<vaadin-icon slot="prefix" class="purple" src="/chart.svg">
							</vaadin-icon>
							Generate a graphic for tracking customer retention
						</vaadin-button>
					</li>
					<li>
						<vaadin-button>
							<vaadin-icon slot="prefix" class="blue" src="/users.svg">
							</vaadin-icon>
							List all customers with at least two tickets in the past year
						</vaadin-button>
					</li>
					<li>
						<vaadin-button>
							<vaadin-icon slot="prefix" class="green" src="/mail.svg">
							</vaadin-icon>
							Write a promotion message about 10% discount
						</vaadin-button>
					</li>
					<li>
						<vaadin-button>
							<vaadin-icon slot="prefix" class="orange" src="/rocket.svg">
							</vaadin-icon>
							List all starships in maintenance
						</vaadin-button>
					</li>
				</ul>
			</div>
			<div class="command-palette-suggestions pb-s pt-xs">
				<h4 class="text-xs font-bold text-secondary flex gap-s items-center leading-xs ai-prompts ms-m">
					<vaadin-icon src="/recent.svg">
					</vaadin-icon>
					Recent
				</h4>
				<ul class="flex flex-col list-none m-0 my-s p-0">
					<li>
						<a aria-current="page" class="active" href="#">
							<vaadin-icon slot="prefix" src="/user.svg">
							</vaadin-icon>
							<div>
								Open
								<em>
									Customers
								</em>
							</div>
						</a>
					</li>
					<li>
						<a class="" href="#">
							<vaadin-icon slot="prefix" src="/ticket.svg">
							</vaadin-icon>
							<div>
								Message to
								<em>
									Sophia Lee
									<span>
										sophia.lee@starships.com
									</span>
								</em>
							</div>
						</a>
					</li>
				</ul>
			</div>
			<div class="command-palette-keyboard-shortcuts sticky bottom-0 p-m py-s flex gap-m justify-between text-2xs text-secondary font-semibold border-t">
				<div class="flex items-center gap-s">
					<span class="key">
						<vaadin-icon src="/enter-key.svg">
						</vaadin-icon>
					</span>
					Open
				</div>
				<div class="flex items-center gap-s">
					<span class="key">
						<vaadin-icon src="/select-key.svg">
						</vaadin-icon>
					</span>
					Select
				</div>
				<div class="flex items-center gap-s">
					<span class="key">
						Esc
					</span>
					Close
				</div>
			</div>
		`
	}

	protected template() { 
		return html`
			<vaadin-dialog
				.overlayClass=${this.getDialogClass()}
				${dialogHeaderRenderer(() => this.renderHeader())}
				${dialogRenderer(() => this.renderDialog())}
				id=${this.getDialogId().slice(1)}
				theme="no-padding">
			</vaadin-dialog>
		`
	}

}

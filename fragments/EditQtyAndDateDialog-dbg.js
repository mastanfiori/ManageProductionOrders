/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/model/resource/ResourceModel",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
		"sap/i2d/mpe/lib/commons1/utils/constants",
		"sap/i2d/mpe/lib/commons1/utils/formatter",
		"sap/m/MessageStrip"
	],

	function (ResourceModel, JSONModel, MessageBox, Constants, MessageStrip) {
		"use strict";

		return {

			//formatter: formatter, 

			initAndOpen: function (oBaseObject, oNamedModel, sObjectPath) {
				var myResourceModel = this._getPopOverResourceBundle();
				var oResourceBundle = myResourceModel.getResourceBundle();
				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("idEditQtyAndDateDialog", "i2d.mpe.orders.manages1.fragments.EditQtyAndDateDialog", this);
					this._oDialog.setModel(myResourceModel, "i18n");
					this._oDialog.attachEvent("afterClose", $.proxy(function () {
						this._oDialog.destroy();
						this._oDialog = undefined;
					}, this));
					oBaseObject.SchedulingType = this.getSchedulingTypes(oResourceBundle);
					//	oBaseObject.busy = true;
					oBaseObject.PlannedTotalQtyValueState = "None";
					oBaseObject.PlannedScrapQtyValueState = "None";
					//Not on UI at the moment/ therefore not changeable
					//oBaseObject.ProductionUnitValueState     = "None";
					oBaseObject.PlannedStartDateValueState = "None";
					//Not on UI at the moment/ therefore not changeable
					//oBaseObject.PlannedStartTimeValueState   = "None";
					oBaseObject.PlannedEndDateValueState = "None";
					//Not on UI at the moment/ therefore not changeable
					// oBaseObject.PlannedEndTimeValueState	   = "None";
					oBaseObject.BasicSchedulingTypeValueState = "None";
					//not relevant
					//oBaseObject.SchedulingTypeNameValueState = "None";

					this._oDialog._oBaseObject = oBaseObject;
					this._oDialog.setModel(oNamedModel);

					var oDialogModel = new JSONModel(oBaseObject);
					this._oDialog.setModel(oDialogModel, "EditQtyAndDateData");
					this._oDialog.bindElement({
						path: sObjectPath,
						events: {
							dataRequested: function () {
								this._oDialog.getModel("EditQtyAndDateData").setProperty("/busy", true);
							}.bind(this),
							dataReceived: function () {
								this._oDialog.getModel("EditQtyAndDateData").setProperty("/busy", false);
							}.bind(this)
						}
					});
				}
				this._openDialog();
				//below code handles datepicker for CURRENT DATE scheduling type
				var checkScheduleType = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateComboBox");
				var startDate = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseStart");
				var endDate = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseEnd");
				var warningStripStartCurrent = sap.ui.getCore().byId("idEditQtyAndDateDialog--idStartWarningMessageCurrent");
				var warningStripEndCurrent = sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageCurrent");
				var warningStripEndForward = sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageForward");
				var warningStripEndBackward = sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageBackward");
				// 4 = Current Date Schedule Type 
				if (checkScheduleType.getSelectedKey() === "4") {
					startDate.setEnabled(false);
					startDate.setValueState(sap.ui.core.ValueState.None);
					endDate.setEnabled(false);
					endDate.setValueState(sap.ui.core.ValueState.None);
					warningStripStartCurrent.setVisible(true);
					warningStripEndCurrent.setVisible(true);
					//disable all other settings
					warningStripEndForward.setVisible(false);
					warningStripEndBackward.setVisible(false);
				}
				// 1 = Forward Schedule Type, 5 = Forwards in Time Schedule Type
				else if (checkScheduleType.getSelectedKey() === "1" || checkScheduleType.getSelectedKey() === "5") {
					endDate.setEnabled(false);
					endDate.setValueState(sap.ui.core.ValueState.None);
					warningStripEndForward.setVisible(true);
					//disable all other settings
					warningStripEndCurrent.setVisible(false);
					warningStripStartCurrent.setVisible(false);
					warningStripEndBackward.setVisible(false);
					startDate.setEnabled(true);
				}
				// 2 = Backward Schedule Type, 6 = Backwards in Time Schedule Type
				else if (checkScheduleType.getSelectedKey() === "2" || checkScheduleType.getSelectedKey() === "6") {
					startDate.setEnabled(false);
					startDate.setValueState(sap.ui.core.ValueState.None);
					warningStripEndForward.setVisible(true);
					//disable all other settings
					warningStripEndCurrent.setVisible(false);
					warningStripStartCurrent.setVisible(false);
					warningStripEndForward.setVisible(false);
					endDate.setEnabled(true);
				} else {
					//enable both the datepickers, if scheduling type is not equal to 1,4 or 2.
					startDate.setEnabled(true);
					endDate.setEnabled(true);
					endDate.setValueState(sap.ui.core.ValueState.None);
					//hide all the messages
					warningStripStartCurrent.setVisible(false);
					warningStripEndCurrent.setVisible(false);
					warningStripEndForward.setVisible(false);
					warningStripEndBackward.setVisible(false);
				}

				var oSaveBtn = sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");
				var oPlannedScrapQty = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateScrapPortion");
				var setErrorMessageForScrapQty = sap.ui.getCore().byId("idEditQtyAndDateDialog--ScrapQtyErrorValidation");
				if (oSaveBtn.setEnabled === false) {
					oPlannedScrapQty.setValueState("None");
					oSaveBtn.setEnabled(true);
					setErrorMessageForScrapQty.setVisible(false);
				}
			},

			getSchedulingTypes: function (oResourceBundle) {
				return [{
					id: "1",
					name: oResourceBundle.getText("schedulingType_forwards")
				}, {
					id: "2",
					name: oResourceBundle.getText("schedulingType_backwards")
				}, {
					id: "3",
					name: oResourceBundle.getText("schedulingType_onlyCapacityRequirements")
				}, {
					id: "4",
					name: oResourceBundle.getText("schedulingType_currentDate")
				}, {
					id: "5",
					name: oResourceBundle.getText("schedulingType_ForwardsInTime")
				}, {
					id: "6",
					name: oResourceBundle.getText("schedulingType_BackwardsInTime")
				}];
			},

			setEventBusParameters: function (oEventBus, sEventChannel, sEventId) {
				this.oEventBus = oEventBus;
				this.sDialogEventChannel = sEventChannel;
				this.sEventId = sEventId;
			},

			_openDialog: function () {
				this._oDialog.open();
			},

			_getPopOverResourceBundle: function () {
				var sI18nFilePath = jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1") + "/" + "i18n/i18n.properties";
				var oResourceModel = new ResourceModel({
					bundleUrl: sI18nFilePath
				});
				return oResourceModel;
			},

			onPressSaveEditQtyAndDate: function (oEvent) {
				var oDialogModel = this._oDialog.getModel("EditQtyAndDateData");
				var oPlannedTotalQty = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateOrderQty");
				var oPlannedScrapQty = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateScrapPortion");
				//Not on UI at the moment/ therefore not changeable
				//var oProductionUnit = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateOrderUnit");
				var oPlannedStartDate = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseStart");
				//Not on UI at the moment/ therefore not changeable
				//var oPlannedStartTime = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateStartTime");
				//var sPlannedStartTime =	this._oDialog._oBaseObject.MfgOrderPlannedStartTime;
				var oPlannedEndDate = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseEnd");
				//Not on UI at the moment/ therefore not changeable
				// var oPlannedEndTime = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateEndTime");
				//var sPlannedEndTime = this._oDialog._oBaseObject.MfgOrderPlannedEndTime;
				var oSchedType = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateComboBox");
				//old scheduling type
				var sgetSchedType = this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType");
				//new scheduling type
				var scalSchedType = sgetSchedType - 1;
				// var scalSchedTypeName = this._oDialog.getModel("EditQtyAndDateData").getProperty("/SchedulingType/" + scalSchedType + "/name");
				var sAllValidated = true;

				//Check, if Total Quantity is valid
				if ((oPlannedTotalQty.getValue() === null) ||
					(oPlannedTotalQty.getValue() === undefined) ||
					(oPlannedTotalQty.getValue() === "") ||
					(oPlannedTotalQty.getValue() <= 0)) {
					//Total Quantity is not valid
					oDialogModel.setProperty("/PlannedTotalQtyValueState", "Error");
					sAllValidated = false;
					oPlannedTotalQty.focus();
					return;
				} else {
					//Total Quantity is valid
					oDialogModel.setProperty("/PlannedTotalQtyValueState", "None");
					sAllValidated = true;
					oPlannedTotalQty.focus();
				}

				//Check, if Scheduling Type is valid
				if ((sgetSchedType === null) ||
					(sgetSchedType === undefined) ||
					(sgetSchedType === "") ||
					(scalSchedType < "0")) {
					//Scheduling Type is not valid
					oDialogModel.setProperty("/BasicSchedulingTypeValueState", "Error");
					sAllValidated = false;
					oSchedType.focus();
					return;
				} else {
					//Scheduling Type is valid
					oDialogModel.setProperty("/BasicSchedulingTypeValueState", "None");
					sAllValidated = true;
					oSchedType.focus();
				}

				//Scheduling type: 1 Forwards
				//Basic Start Date is mandatory
				//Check, if Basic Start Date is valid
				if ((sgetSchedType === "1")) {
					if ((oPlannedStartDate.getDateValue() === null) ||
						(oPlannedStartDate.getDateValue() === undefined) ||
						(oPlannedStartDate.getDateValue() === "")) {
						//Basic Start Date is not valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "Error");
						sAllValidated = false;
						oPlannedStartDate.focus();
						return;
					} else {
						//Basic Start Date is valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "None");
						sAllValidated = true;
						oPlannedStartDate.focus();
					}

					//Basic End Date is not required
					// if ((oPlannedEndDate.getDateValue() !== null) ||
					// 	(oPlannedEndDate.getDateValue() !== undefined) ||
					// 	(oPlannedEndDate.getDateValue() !== "")) {
					// 	//Value is cleared
					// 	oPlannedEndDate.setValue("");
					// }
				}

				//Scheduling type: 2 Backwards
				//Basic End Date is mandatory
				//Check, if Basic End Date is valid
				if ((sgetSchedType === "2")) {
					if ((oPlannedEndDate.getDateValue() === null) ||
						(oPlannedEndDate.getDateValue() === undefined) ||
						(oPlannedEndDate.getDateValue() === "")) {
						//Basic End Date is not valid
						oDialogModel.setProperty("/PlannedEndDateValueState", "Error");
						sAllValidated = false;
						oPlannedEndDate.focus();
						return;
					} else {
						//Basic End Date is valid
						oDialogModel.setProperty("/PlannedEndDateValueState", "None");
						sAllValidated = true;
						oPlannedEndDate.focus();
					}

					//Basic Start Date is not required
					if ((oPlannedStartDate.getDateValue() !== null) ||
						(oPlannedStartDate.getDateValue() !== undefined) ||
						(oPlannedStartDate.getDateValue() !== "")) {
						//Value is cleared
						//oPlannedStartDate.setValue("");
					}
				}

				//Scheduling type: 3 Only capacity requirements
				//Basic Start Date and Basic End Date are mandatory
				//Check, if Basic Start Date and Basic End Date are valid
				if ((sgetSchedType === "3")) {
					if ((oPlannedStartDate.getDateValue() === null) ||
						(oPlannedStartDate.getDateValue() === undefined) ||
						(oPlannedStartDate.getDateValue() === "")) {
						//Basic Start Date is not valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "Error");
						sAllValidated = false;
						oPlannedStartDate.focus();
						return;
					} else {
						//Basic Start Date is valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "None");
						sAllValidated = true;
						oPlannedStartDate.focus();
					}

					if ((oPlannedEndDate.getDateValue() === null) ||
						(oPlannedEndDate.getDateValue() === undefined) ||
						(oPlannedEndDate.getDateValue() === "")) {
						//Basic End Date is not valid
						oDialogModel.setProperty("/PlannedEndDateValueState", "Error");
						sAllValidated = false;
						oPlannedEndDate.focus();
						return;
					} else {
						//Basic End Date is valid
						oDialogModel.setProperty("/PlannedEndDateValueState", "None");
						sAllValidated = true;
						oPlannedEndDate.focus();
					}

					//Check, if Basic Start Date is greater than the Basic End Date
					if (Date.parse(oPlannedStartDate.getDateValue()) > Date.parse(oPlannedEndDate.getDateValue())) {
						//Basic Start Date is not valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "Error");
						sAllValidated = false;
						oPlannedStartDate.focus();
						return;
					} else {
						//Basic Start Date is valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "None");
						sAllValidated = true;
						oPlannedStartDate.focus();
					}
				}

				//Scheduling type: 4 Current date
				//Basic Start Date and Basic End Date can be empty
				//Check, if Basic Start Date and Basic End Date are valid
				if ((sgetSchedType === "4")) {
					if ((oPlannedStartDate.getDateValue() === null) ||
						(oPlannedStartDate.getDateValue() === undefined) ||
						(oPlannedStartDate.getDateValue() === "")) {
						//Basic Start Date is not valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "Error");
						sAllValidated = false;
						oPlannedStartDate.focus();
						return;
					} else {
						//Basic Start Date is valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "None");
						sAllValidated = true;
						oPlannedStartDate.focus();
					}

					//Basic End Date is not required
					// if ((oPlannedEndDate.getDateValue() !== null) ||
					// 	(oPlannedEndDate.getDateValue() !== undefined) ||
					// 	(oPlannedEndDate.getDateValue() !== "")) {
					// 	//Value is cleared
					// 	oPlannedEndDate.setValue("");
					// }

					//Check, if Basic Start Date is greater than the Basic End Date
					if (Date.parse(oPlannedStartDate.getDateValue()) > Date.parse(oPlannedEndDate.getDateValue())) {
						//Basic Start Date is not valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "Error");
						sAllValidated = false;
						oPlannedStartDate.focus();
						return;
					} else {
						//Basic Start Date is valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "None");
						sAllValidated = true;
						oPlannedStartDate.focus();
					}
				}

				//Scheduling type: 5 Forwards in time
				//Basic Start Date and Basic Start Time are mandatory
				//Check, if Basic Start Date and Basic Start Time are valid
				if ((sgetSchedType === "5")) {
					if ((oPlannedStartDate.getDateValue() === null) ||
						(oPlannedStartDate.getDateValue() === undefined) ||
						(oPlannedStartDate.getDateValue() === "")) {
						//Basic Start Date is not valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "Error");
						sAllValidated = false;
						oPlannedStartDate.focus();
						return;
					} else {
						//Basic Start Date is valid
						oDialogModel.setProperty("/PlannedStartDateValueState", "None");
						sAllValidated = true;
						oPlannedStartDate.focus();
					}

					//Basic End Date is not required
					// if ((oPlannedEndDate.getDateValue() !== null) ||
					// 	(oPlannedEndDate.getDateValue() !== undefined) ||
					// 	(oPlannedEndDate.getDateValue() !== "")) {
					// 	//Value is cleared
					// 	oPlannedEndDate.setValue("");
					// }

					//Not on UI at the moment/ therefore not changeable
					// if ((sPlannedStartTime === null) ||
					// 	(sPlannedStartTime === undefined) ||
					// 	(sPlannedStartTime === "")) {
					//     	//Basic Start Time is not valid
					// 		oDialogModel.setProperty("/PlannedStartTimeValueState", "Error");
					// 		sAllValidated = false;
					// 		oPlannedStartTime.focus();
					// 		return;
					// }else{
					//     	//Basic Start Time is valid
					// 		oDialogModel.setProperty("/PlannedStartTimeValueState", "None");
					//         sAllValidated = true;
					// 		oPlannedStartTime.focus();	
					// }
				}

				//Scheduling type: 6 Backwards in time
				//Basic End Date and Basic End Time are mandatory
				//Check, if Basic End Date and Basic End Time are valid
				if ((sgetSchedType === "6")) {
					if ((oPlannedEndDate.getDateValue() === null) ||
						(oPlannedEndDate.getDateValue() === undefined) ||
						(oPlannedEndDate.getDateValue() === "")) {
						oDialogModel.setProperty("/PlannedEndDateValueState", "Error");
						sAllValidated = false;
						oPlannedEndDate.focus();
						return;
					} else {
						oDialogModel.setProperty("/PlannedEndDateValueState", "None");
						sAllValidated = true;
						oPlannedEndDate.focus();
					}

					/*	//Basic Start Date is not required
						if ((oPlannedStartDate.getDateValue() !== null) ||
							(oPlannedStartDate.getDateValue() !== undefined) ||
							(oPlannedStartDate.getDateValue() !== "")) {
							//Value is cleared
							oPlannedStartDate.setValue("");
						}*/

					//Not on UI at the moment/ therefore not changeable
					// if ((sPlannedEndTime === null) ||
					// 	(sPlannedEndTime === undefined) ||
					// 	(sPlannedEndTime === "")) {
					// 		oDialogModel.setProperty("/PlannedEndTimeValueState", "Error");
					// 		sAllValidated = false;
					// 		sPlannedEndTime.focus();
					// 		return;
					// }else{
					// 		oDialogModel.setProperty("/PlannedEndTimeValueState", "None");
					// 		sAllValidated = true;
					// 		sPlannedEndTime.focus();	
					// }
				}

				if (sAllValidated) {
					var oData = this._oDialog.getBindingContext().getObject(),
						oPlannedStartDateWithoutTimeZone,
						oPlannedStartDateWithTimeZone,
						oPlannedEndDateWithoutTimeZone,
						oPlannedEndDateWithTimeZone;
					this._oDialog.getModel("EditQtyAndDateData").setProperty("/busy", true);

					if (oPlannedStartDate.getDateValue() !== null) {
						//UI is using the local timezone which is in my case WET time (Western European Time)
						oPlannedStartDateWithoutTimeZone = oPlannedStartDate.getDateValue();
						//This solution is good!
						//This WET time (Western European Time) must be converted into GMT time (Greenwich Mean Time) or UTC time (Coordinated Universal Time) which is the same
						//otherwise there can be one day lost by transferring the date to the backend
						//oPlannedStartDateWithTimeZone = new Date(oPlannedStartDateWithoutTimeZone.getTime() + oPlannedStartDateWithoutTimeZone.getTimezoneOffset() * -60000 );

						//But this solution is better!!
						oPlannedStartDateWithTimeZone = new Date(Date.UTC(oPlannedStartDateWithoutTimeZone.getFullYear(),
							oPlannedStartDateWithoutTimeZone.getMonth(),
							oPlannedStartDateWithoutTimeZone.getDate()));
					}

					if (oPlannedEndDate.getDateValue() !== null) {
						//UI is using the local timezone which is in my case WET time (Western European Time)
						oPlannedEndDateWithoutTimeZone = oPlannedEndDate.getDateValue();
						//This solution is good!
						//This WET time (Western European Time) must be converted into GMT time (Greenwich Mean Time) or UTC time (Coordinated Universal Time) which is the same
						//otherwise there can be one day lost by transferring the date to the backend
						//oPlannedEndDateWithTimeZone = new Date(oPlannedEndDateWithoutTimeZone.getTime() + oPlannedEndDateWithoutTimeZone.getTimezoneOffset() * -60000 );

						//But this solution is better!!
						oPlannedEndDateWithTimeZone = new Date(Date.UTC(oPlannedEndDateWithoutTimeZone.getFullYear(),
							oPlannedEndDateWithoutTimeZone.getMonth(),
							oPlannedEndDateWithoutTimeZone.getDate()));
					}

					var oNrFormatter = sap.ui.core.format.NumberFormat.getInstance({style : "full"});
					var iPlannedTotalQty = oNrFormatter.parse(oPlannedTotalQty.getValue());
					var iPlannedScrapQty = oPlannedScrapQty.getValue() !== "" ? oNrFormatter.parse(oPlannedScrapQty.getValue()) : "0.00";
					var oURLParameters = {
						ManufacturingOrder: this._oDialog._oBaseObject.hasOwnProperty("ManufacturingOrder") ? this._oDialog._oBaseObject.ManufacturingOrder : "",
						MfgOrderPlannedTotalQty: iPlannedTotalQty,
						//If value is not filled by the user. Value is automatically set to "0.00" to avoid
						//gateway error "Malformed URI literal syntax"
						MfgOrderPlannedScrapQty: iPlannedScrapQty,
						ProductionUnit: oData.ProductionUnit,
						//If value is not filled by the user or value is not required for scheduling in the backend it is cleared with setValue("") first
						//and later on automatically set to "undefined". Gateway error "Malformed URI literal syntax" does not occur because field 
						//content is not defined as mandatory in backend class CL_PP_MPE_ORDER_MANAGE_MPC_EXT/ method DEFINE.
						MfgOrderPlannedStartDate: oPlannedStartDateWithTimeZone ? oPlannedStartDateWithTimeZone : undefined,
						MfgOrderPlannedStartTime: oData.MfgOrderPlannedStartTime,
						//If value is not filled by the user or value is not required for scheduling in the backend it is cleared with setValue("") first
						//and later on automatically set to "undefined". Gateway error "Malformed URI literal syntax" does not occur because field 
						//content is not defined as mandatory in backend class CL_PP_MPE_ORDER_MANAGE_MPC_EXT/ method DEFINE.
						MfgOrderPlannedEndDate: oPlannedEndDateWithTimeZone ? oPlannedEndDateWithTimeZone : undefined,
						MfgOrderPlannedEndTime: oData.MfgOrderPlannedEndTime,

						BasicSchedulingType: sgetSchedType
					};

					this._oDialog.getModel().callFunction("/C_ManageProductionOrderUpdateorder", {
						method: "POST",
						urlParameters: oURLParameters,
						success: this._onSuccessEditQtyAndDate.bind(this),
						error: this._onErrorEditQtyAndDate.bind(this)
					});
				}
			},

			_onChangeOderQuantity: function () {
				var oDialogModel = this._oDialog.getModel("EditQtyAndDateData");
				var oPlannedTotalQty = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateOrderQty");
				//Check, if Total Quantity is valid
				if ((oPlannedTotalQty.getValue() === null) ||
					(oPlannedTotalQty.getValue() === undefined) ||
					(oPlannedTotalQty.getValue() === "") ||
					(oPlannedTotalQty.getValue() <= 0)) {
					//Total Quantity is not valid
					oDialogModel.setProperty("/PlannedTotalQtyValueState", "Error");
					oPlannedTotalQty.focus();
					return;
				} else {
					//Total Quantity is valid
					oDialogModel.setProperty("/PlannedTotalQtyValueState", "None");
					oPlannedTotalQty.focus();
				}
			},

			_onChangeScrapQuantity: function () {
				//var oDialogModel = this._oDialog.getModel("EditQtyAndDateData");
				
				//this REGEX is not used anymore cause most of the validation is done in the backend. Only negative values are checked
				//var regex = /^(?:[1-9]\d*|0)?(?:\.\d+)?$/;
				
				//REGEX is used to compare if Scrap qty is negative number
				var regex = /^-/;
				
				var oPlannedScrapQty = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateScrapPortion");
				var oSaveBtn = sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");
				var sPlannedScrapQty = oPlannedScrapQty.getValue();
				var sLength = (sPlannedScrapQty.trim()).length;
				//var setErrorMessageForScrapQty = sap.ui.getCore().byId("idEditQtyAndDateDialog--ScrapQtyErrorValidation");

				//Check, if Scrap Portion is valid
				if (sLength <= 0) {
					//text is blank or space
					oPlannedScrapQty.setValue("0");
				}
				//this if loop handles if user enters Scrap quantity in negative number
				if (sPlannedScrapQty.match(regex)) {
					var oResourceBundle = this._getPopOverResourceBundle().getResourceBundle();
					oPlannedScrapQty.setValueState("Error");
					oPlannedScrapQty.setValueStateText(oResourceBundle.getText("scrpQtyNoNegative"));
					oSaveBtn.setEnabled(false);
					//setErrorMessageForScrapQty.setVisible(true);
				} else {
					oPlannedScrapQty.setValueState("None");
					oSaveBtn.setEnabled(true);
					/*
					if(setErrorMessageForScrapQty !== undefined)
					{
						setErrorMessageForScrapQty.setVisible(false);
                    }
                    */

				}
				
			},

			_onChangeStartDatePicker: function (oEvent) {
				//validation for date picker if user enters wrong date format
				var oSaveBtn = sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");
				var oDP = oEvent.getSource();
				var bValid = oEvent.getParameter("valid");
				if (bValid) {
					oDP.setValueState(sap.ui.core.ValueState.None);
						oSaveBtn.setEnabled(true);
					//for scheduling type  4 (current date), 
					if (this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType") === "4") {
						sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseStart").setEnabled(false);
					
					}

				} else {
					oDP.setValueState(sap.ui.core.ValueState.Error);
					oSaveBtn.setEnabled(false);
				}
				// var oDialogModel = this._oDialog.getModel("EditQtyAndDateData");
				// var oPlannedStartDate = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseStart");
				// // var sPlannedStartDate = this._oDialog.getModel("EditQtyAndDateData").getProperty("/MfgOrderPlannedStartDate");
				// if ((oPlannedStartDate.getDateValue() === null) ||
				// 	(oPlannedStartDate.getDateValue() === undefined) ||
				// 	(oPlannedStartDate.getDateValue() === "")) {
				// 		oDialogModel.setProperty("/PlannedStartDateValueState", "Error");
				// 		oPlannedStartDate.focus();
				// 		return;
				// // }else{
				// // 	var dToday = new Date();
				// // 	dToday.setHours(0, 0, 0, 0);
				// // 	if (sPlannedStartDate < dToday) {
				// // 		oDialogModel.setProperty("/PlannedStartDateValueState", "Error");
				// // 		oPlannedStartDate.focus();
				// // 		return;
				// // 	}
				// }
			},

			_onChangeEndDatePicker: function (oEvent) {
				//validation for date picker if user enters wrong date format
				var oSaveBtn = sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");
				var oDP = oEvent.getSource();
				var bValid = oEvent.getParameter("valid");
				if (bValid) {
					oDP.setValueState(sap.ui.core.ValueState.None);
					oSaveBtn.setEnabled(true);
				} else {
					oDP.setValueState(sap.ui.core.ValueState.Error);
					oSaveBtn.setEnabled(false);
				}
				// var oDialogModel = this._oDialog.getModel("EditQtyAndDateData");
				// var oPlannedEndDate = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseEnd");
				// //var sPlannedEndDate = this._oDialog.getModel("EditQtyAndDateData").getProperty("/MfgOrderPlannedEndDate");
				// if ((oPlannedEndDate.getDateValue() === null) ||
				// 	(oPlannedEndDate.getDateValue() === undefined) ||
				// 	(oPlannedEndDate.getDateValue() === "")) {
				// 		oDialogModel.setProperty("/PlannedEndDateValueState", "Error");
				// 		oPlannedEndDate.focus();
				// 		return;
				// // }else{
				// // 	var dToday = new Date();
				// // 	dToday.setHours(0, 0, 0, 0);
				// // 	if (sPlannedEndDate < dToday) {
				// // 		oDialogModel.setProperty("/PlannedEndDateValueState", "Error");
				// // 		oPlannedEndDate.focus();
				// // 		return;
				// // 	}
				// }
			},

			_onChangeSchedulingType: function () {
				var oDialogModel = this._oDialog.getModel("EditQtyAndDateData");
				var oSchedType = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateComboBox");
				var sgetSchedType = this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType");
				var scalSchedType = sgetSchedType - 1;
				var oSaveBtn = sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");
				oSaveBtn.setEnabled(true);

				//Check, if Scheduling Type is valid
				if ((sgetSchedType === null) ||
					(sgetSchedType === undefined) ||
					(sgetSchedType === "") ||
					(scalSchedType < "0")) {
					//Scheduling Type is not valid
					oDialogModel.setProperty("/BasicSchedulingTypeValueState", "Error");
					oSchedType.focus();
					return;
				} else {
					//Scheduling Type is valid
					oDialogModel.setProperty("/BasicSchedulingTypeValueState", "None");
					oSchedType.focus();
				}
				/*In scheduling type "CURRENT DATE", start date and end date are calculated in backend. 
				So they will be disabled for Scheduling type 4 (current date)*/
				var startDate = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseStart");
				var endDate = sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseEnd");
				var warningStripStartCurrent = sap.ui.getCore().byId("idEditQtyAndDateDialog--idStartWarningMessageCurrent");
				var warningStripEndCurrent = sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageCurrent");
				var warningStripEndForward = sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageForward");
				var warningStripEndBackward = sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageBackward");
				// 4 = Current date scheduling type
				if (this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType") === "4") {
					startDate.setEnabled(false);
					endDate.setEnabled(false);
					warningStripStartCurrent.setVisible(true);
					warningStripEndCurrent.setVisible(true);
					//disable all other message strips
					warningStripEndForward.setVisible(false);
					warningStripEndBackward.setVisible(false);
				}
				// 1 = Forward scheduling type, 5 = Forwards in Time Schedule Type
				else if (this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType") === "1" || this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType") === "5") {
					endDate.setEnabled(false);
					warningStripEndForward.setVisible(true);
					//disable all other message strips
					warningStripEndCurrent.setVisible(false);
					warningStripStartCurrent.setVisible(false);
					warningStripEndBackward.setVisible(false);
					startDate.setEnabled(true);
				}
				// 2 = Backward Schedule Type, 6 = Backwards in Time Schedule Type 
				else if (this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType") === "2" || this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType") === "6") {
					startDate.setEnabled(false);
					warningStripEndBackward.setVisible(true);
					//disable all other message strips
					warningStripEndCurrent.setVisible(false);
					warningStripStartCurrent.setVisible(false);
					warningStripEndForward.setVisible(false);
					endDate.setEnabled(true);
				} else {
					startDate.setEnabled(true);
					endDate.setEnabled(true);
					//hide all the message strips
					warningStripStartCurrent.setVisible(false);
					warningStripEndCurrent.setVisible(false);
					warningStripEndForward.setVisible(false);
					warningStripEndBackward.setVisible(false);
				}
			},

			onPressCancelEditQtyAndDate: function () {
				this._oDialog.close();
			},

			_onSuccessEditQtyAndDate: function (oData, oResponse) {
				var oResourceBundle = this._getPopOverResourceBundle().getResourceBundle();
				var oResponseHeaderMessage;
				if (oResponse.headers["sap-message"]) {
					oResponseHeaderMessage = JSON.parse(oResponse.headers["sap-message"]);
				}
				var oSuccessMessage = {
					aError: [],
					aWarning: []
				};
				var sFinalText;
				var sMessageText;
				var bSuccess = true;
				if (oResponseHeaderMessage) {
					if (oResponseHeaderMessage.severity === "error" || oResponseHeaderMessage.severity === "warning") {
						bSuccess = false;
						if (oResponseHeaderMessage.severity === "error") {
							oSuccessMessage.aError.push(oResponseHeaderMessage);
							sMessageText = oResponseHeaderMessage.message;
							sFinalText = oSuccessMessage.aError[0].message;
						} else if (oResponseHeaderMessage.severity === "warning") {
							oResponseHeaderMessage.order = oData.ManufacturingOrder;
							sMessageText = oResponseHeaderMessage.message;
							oSuccessMessage.aWarning.push(oResponseHeaderMessage);
							sFinalText = oSuccessMessage.aWarning[0].message;
						}
						var oErrorResponse = {
							success: false,
							info: sMessageText,
							detail: sFinalText
						};
						this.oEventBus.publish(this.sDialogEventChannel, this.sEventId, oErrorResponse);
					}
				}
				if (bSuccess === true) {
					// sMessageText = oResourceBundle.getText("orderUpdateMSG", [oData.ManufacturingOrder]);
					sMessageText = oResponseHeaderMessage.message;
					if (this.oEventBus) {
						var oSuccessResponse = {
							success: true,
							info: sMessageText
						};
						this._oDialog.close();
						this.oEventBus.publish(this.sDialogEventChannel, this.sEventId, oSuccessResponse);
					}
				}
				this._oDialog.getModel("EditQtyAndDateData").setProperty("/busy", false);
				// var sInfoMsg;

				// if (this.oEventBus) {
				// 	var oSuccessResponse = {
				// 		success: true,
				// 		info: sInfoMsg
				// 	};
				// 	this.oEventBus.publish(this.sDialogEventChannel, this.sEventId, oSuccessResponse);
				// }
				
			},

			_onErrorEditQtyAndDate: function (oResponse) {
				var oResponseText, sFinalText, sInfo;
				if(oResponse.responseText.indexOf("<?xml") !== -1){
					sFinalText = oResponse;
					sInfo = this._getPopOverResourceBundle().getResourceBundle().getText("errorText");
				} else {
					oResponseText = JSON.parse(oResponse.responseText);
					sFinalText = oResponse.message;
					sInfo = oResponseText.error.message.value;
				}

				if (this.oEventBus) {
					var oErrorResponse = {
						success: false,
						info: sInfo,
						detail: sFinalText
					};
					this.oEventBus.publish(this.sDialogEventChannel, this.sEventId, oErrorResponse);
				}
				//	MessageBox.error(oResponseText.error.message.value);
				this._oDialog.close();
			}

		};
	});
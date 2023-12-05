/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global location*/
sap.ui.define([
		"i2d/mpe/orders/manages1/controller/BaseController",
		"sap/i2d/mpe/lib/commons1/blocks/OrderDetailsHeaderHelper",
		"sap/ui/model/resource/ResourceModel",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"i2d/mpe/orders/manages1/model/formatter",
		"sap/i2d/mpe/lib/commons1/utils/formatter",
		"sap/i2d/mpe/lib/commons1/utils/util",
		"sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus",
		"sap/i2d/mpe/lib/popovers1/fragments/MaterialController",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"sap/ui/model/Filter",
		"sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog",
		"sap/i2d/mpe/lib/commons1/utils/constants",
		"sap/i2d/mpe/lib/qmcomps1/util/Defects",
		"sap/i2d/mpe/lib/qmcomps1/util/Formatter",
		"sap/i2d/mpe/lib/commons1/fragments/OrdSpcfcChange",
		"sap/i2d/mpe/lib/commons1/utils/NavHelper",
		"i2d/mpe/orders/manages1/fragments/OrderSplitDialog"
	],

	function (BaseController, OrdDetailHeadHelper, ResourceModel, JSONModel, History, formatter, commonFormatter, reuseUtil,
		OrderOperationStatus, MaterialPopOver, MessageToast, MessageBox, Filter,
		ApplyHoldDialog, ReuseProjectConstants, Defects, defectFormatter, OrdSpcfcChange, NavHelper, OrderSplitDialog) {
		"use strict";

		return BaseController.extend("i2d.mpe.orders.manages1.controller.Object", {

			formatter: formatter,
			commonFormatter: commonFormatter,
			reuseUtil: reuseUtil,
			defectFormatter: defectFormatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */
			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit: function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var iOriginalBusyDelay,
					oViewModel = new JSONModel({
						busy: true,
						isOrderSplitEnabled: false,
						OperationForOrderSplit: {},
						delay: 0
					});
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.subscribe("AppState", "hanldeAppstateDetailChanges", this.hanldeAppstateDetailChanges, this);
				this._oOneOrderReleaseButton = this.getView().byId("idOneOrderReleaseButton");
				this.getRouter().getRoute("object").attachPatternMatched(this._handleRouteMatched, this);
				// Store original busy indicator delay, so it can be restored later on
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
				this.setModel(oViewModel, "objectView");
				this.getOwnerComponent().getModel().metadataLoaded().then(function () {
					// Restore original busy indicator delay for the object view
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				});
				var oObjectPageLayout = this.getView().byId("idOrderObjectPageLayout");
				formatter.setObjectPageLayoutReference(oObjectPageLayout);
				commonFormatter.setObjectPageLayoutReference(oObjectPageLayout);
				reuseUtil.setObjectPageRefrence(this);
				this.setModel(new JSONModel({
					sSelectedKey: "Standard"
				}), "sequenceGraph");
				// initializing popover Instance
				// this.oMaterialPop = new MaterialPopOver();
				var oShopFloorItemModel = new JSONModel();
				this.getView().setModel(oShopFloorItemModel, "shopflooritems");
				var oOrderDetailModel = this.getOwnerComponent().getModel("DetailModel");
				var oOrderDetailData = oOrderDetailModel.getData();
				if (oOrderDetailData.bEnableAutoBinding) {
					this._bDetailsScreenInitialLoad = true;
				} else {
					this._bDetailsScreenInitialLoad = false;
				}
				this._oCommonsI18nModel = this.getCommonsI18nModel();
				this.getView().setModel(this._oCommonsI18nModel, "common_i18n");
				commonFormatter._i18n = this._oCommonsI18nModel;
				commonFormatter.loadI18NFile();
				this.setModel(new JSONModel({
					"EditButtonVisible": false,
					"ConfirmButtonVisible": false,
					"bIsDisplayOrderSpecificHoldAvailable": false,
					"bIsDisplayOrderSpecificHoldNavigable": false,
					"bIsOrderSpecificHoldAvailable": false
				}), "ActionButtonVisiblity");

				//Check if navigable intents are available
				if (sap.ushell && sap.ushell.Container) {
					var aSemantic = [];
					aSemantic.push("#ProductionOrder-change");
					aSemantic.push("#ShopFloorRouting-change");
					sap.ushell.Container.getService("CrossApplicationNavigation").isIntentSupported(aSemantic).done(function (oCheck) {
						if (oCheck) {
							this.getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", oCheck["#ProductionOrder-change"].supported);
							this.getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldNavigable", oCheck["#ShopFloorRouting-change"]
								.supported);
						}
					}.bind(this)).
					fail(function () {
						jQuery.sap.log.error("Reading intent data failed.");
						this.getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", true);
						this.getModel("ActionButtonVisiblity").setProperty("/ConfirmButtonVisible", true);
						this.getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldNavigable", true);
					});
				} else {
					this.getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", true);
					this.getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldNavigable", true);
				}

				OrdDetailHeadHelper.onInit(this._oOneOrderReleaseButton, oObjectPageLayout, this.getView());

				// Set parameters for event bus
				var oEventBusParams = this.getEventBusParameters();
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.subscribe(oEventBusParams.ApplyHoldDialog.Channel, oEventBusParams.ApplyHoldDialog.Event, oEventBusParams.ApplyHoldDialog
					.Callback, this);
				// Subcribe for events from Release order anyway functionality
				oEventBus.subscribe(oEventBusParams.ReleaseOrderAnyway.Channel, oEventBusParams.ReleaseOrderAnyway.Event, oEventBusParams.ReleaseOrderAnyway
					.Callback, this);
				ApplyHoldDialog.setEventBusParameters(oEventBus, oEventBusParams.ApplyHoldDialog.Channel,
					oEventBusParams.ApplyHoldDialog.Event);
				this._DefectsClass = new Defects();
			},

			onNavToDefect: function (oEvent) {
				this._DefectsClass.onNavToDefect(oEvent);
			},

			defectsCallbackFn: function (aDefects) {
				// if (aDefects.length > 0 && aDefects[0].SerialNumber !== "") {
				// 	this._DefectsClass.setVisibleColumns(true, true);
				// } else {
				// 	this._DefectsClass.setVisibleColumns(false, true);
				// }
			},

			/**
			 * getCommonsI18nModel applies text labels from Reuse project
			 * @memberOf i2d.mpe.orders.manages1.controller.Worklist
			 * @public
			 */
			getCommonsI18nModel: function () {
				var sI18NFilePath = jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1") + "/" + "i18n/i18n.properties";
				var oI18nModel = new ResourceModel({
					bundleUrl: sI18NFilePath
				});
				return oI18nModel;
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */
			/*
			 * formatter to get the Order number along with Order text ,
			 * as the title in the object page header
			 * @param {string} sManufacturingOrder - the Order number 
			 */
			getOrderNumber: function (sManufacturingOrder) {
				// if (sManufacturingOrder) {
				// 	return this.getI18NText("OrderDetailTitle", [sManufacturingOrder]);
				// }

				return OrdDetailHeadHelper.getOrderNumber(sManufacturingOrder);
			},

			/** 
			 * getI18NText method gets the i18n text from i18n folder based on the key
			 * @public
			 * @param {string} key of i18n text maintained in properties file.
			 * @param {array} pass parameters for that key
			 */
			getI18NText: function (isKey, aValues) {
				if (aValues) {
					return this._oCommonsI18nModel.getResourceBundle().getText(isKey, aValues);
				} else {
					return this._oCommonsI18nModel.getResourceBundle().getText(isKey);
				}
			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */
			/**
			 * Route matched handler of the view.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_handleRouteMatched: function (oEvent) {
				var sOrderId = oEvent.getParameter("arguments").orderId;
				this.gsOrderId = sOrderId;
				this.iAppState = oEvent.getParameter("arguments").iAppState;

				this.getModel().metadataLoaded().then(function () {
					this._bindView("/" + sOrderId);
				}.bind(this));
				this.updateOrderModel();
				var sAppState = oEvent.getParameter("arguments").iAppState;
				var sConfigName = oEvent.getParameter("config").name;
				this.getOwnerComponent().extractInnerAppStateFromURL(sAppState, sConfigName, sOrderId);
			},

			/**
			 * Binds the view to the object path.
			 * @param {string} sOrderPath path to the object to be bound
			 * @private
			 */
			_bindView: function (sOrderPath) {
				var that = this;
				// Setting the odatat model to not use batch requests for details screen. 
				// changes are done to improve performance and execute backend calls in parallel
				var oViewModel = this.getModel("objectView"),
					oDataModel = this.getModel();
				var sExtendedColumns = this._getFieldExtensionColumns(oDataModel);
				var sStatusColumns = this._getStatusColumns(oDataModel, sOrderPath);
				var sSelectColumns =
					"ManufacturingOrder,OrderIsShopFloorOrder,ProductConfiguration,OrderStatusInternalID,MfgFeatureIsActiveInAnyPlant,ManufacturingFeature," +
					"ManufacturingFeatureIsActive,Material,MaterialName,MRPControllerName,MfgOrderPlannedTotalQty,ProductionUnit,EffectivityParameterDesc," +
					"EffctyTypeCnctntdParamDesc,OrderHasMissingComponents,OrderHasQualityIssue,InspHasRejectedCharc,OrderInternalBillOfOperations," +
					"InspHasRejectedInspSubset,InspHasRejectedInspLot,MfgOrderConfirmedScrapQty,OrderYieldDeviationQty,OrderMissingQuantity,OrderExecutionEndIsLate," +
					"OrderExecutionStartIsLate,ExecutionEndLatenessInMinutes,ExecutionStartLatenessInMins,ProductionPlant,MRPArea,MRPAreaText,MRPPlant,MRPPlantName," +
					"ProductionLine,ProductionVersion,ProductionVersionText,ManufacturingOrderImportance,MRPController,MfgOrderSuperiorMfgOrder,WBSElement,WBSDescription," +
					"SalesDocument,SalesDocumentItem,CustomerName,ProdnProcgFlexibilityIndName,MfgOrderScheduledStartDate,MfgOrderScheduledEndDate,MfgOrderScheduledStartTime," +
					"MfgOrderScheduledEndTime,MfgOrderActualStartDate,MfgOrderActualStartTime,MfgOrderActualEndDate,MfgOrderPlannedStartDate,MfgOrderPlannedStartTime," +
					"MfgOrderPlannedEndDate,MfgOrderPlannedEndTime,MfgOrderScheduledReleaseDate,MfgOrderPlannedYieldQty,MfgOrderConfirmedYieldQty,ActualDeliveredQuantity," +
					"OrderOpenQuantity,ManufacturingOrderOperation,MfgOrderOperationText,ManufacturingOrderType,ManufacturingOrderTypeName,IsCloudSystem," +
					"BasicSchedulingType,MfgOrderSplitStatus";
				// var oDetailModel = this.getModel("DetailModel"),
				// oOrderDetailData = oDetailModel.getData();
				oDataModel.setUseBatch(false);
				this.getView().bindElement({
					path: sOrderPath,
					parameters: {
						select: sSelectColumns + sExtendedColumns + sStatusColumns
					},
					events: {
						change: this._onBindingChange.bind(this),
						dataRequested: function () {
							that.getModel().metadataLoaded().then(function () {
								// Busy indicator on view should only be set if metadata is loaded,
								// otherwise there may be two busy indications next to each other on the
								// screen. This happens because route matched handler already calls '_bindView'
								// while metadata is loaded.
								oViewModel.setProperty("/busy", true);
							});
						},
						dataReceived: function (oData) {
							// var oModel = that.getView().getModel();
							// var oBindingContext = that.getView().getBindingContext();
							// var MfgFeatureIsActiveInAnyPlant = oModel.getProperty("MfgFeatureIsActiveInAnyPlant", oBindingContext);
							// if (oOrderDetailData.selectedOrderData && MfgFeatureIsActiveInAnyPlant === undefined) {
							// 	MfgFeatureIsActiveInAnyPlant = oOrderDetailData.selectedOrderData.MfgFeatureIsActiveInAnyPlant;
							// }
							oViewModel.setProperty("/busy", false);
						}
					}
				});

				//On change of order, reset the flag to false
				oViewModel.setProperty("/isOrderSplitEnabled", false);
			},

			/**
			 * Gets all the customer extended field names to add it into the select command
			 * @function
			 * @param {object} oDatamodel contains the odata service information
			 * @private
			 */
			_getFieldExtensionColumns: function (oDataModel) {
				var oEntityType = oDataModel.oMetadata._getEntityTypeByName("C_ManageProductionOrderType");
				var sColumns = "";
				if (oEntityType) {
					var aEntityProperties = oEntityType.property;
					aEntityProperties.forEach(function (Item, Index) {
						if (Item.name.match(/YY1_/gi) && Item.name.match(/YY1_/gi).length > 0) {
							sColumns = sColumns + "," + Item.name;
						}
					}, this);
				}
				return sColumns;
			},

			/**
			 * Gets all the status columns to make odata request when navigated directly to object page
			 * @function
			 * @param {object} oDatamodel contains the odata service information
			 * @param {string} sPath  Contains the binding path to the object page view
			 * @private
			 */
			_getStatusColumns: function (oModel, sPath) {
				var aStatusColumns = ["OrderIsCreated", "OrderIsReleased", "OrderIsPrinted", "OrderIsConfirmed", "OrderIsPartiallyConfirmed",
					"OrderIsDelivered", "OrderIsDeleted",
					"OrderIsPreCosted", "SettlementRuleIsCreated", "OrderIsPartiallyReleased", "OrderIsTechnicallyCompleted", "OrderIsClosed",
					"OrderIsPartiallyDelivered",
					"OrderIsLocked", "SettlementRuleIsCrtedManually", "OrderIsScheduled", "OrderHasGeneratedOperations",
					"OrderIsToBeHandledInBatches", "MaterialAvailyIsNotChecked"
				];
				var oBindingProperties = oModel.getProperty(sPath);
				var sColumns = "",
					i = 0;
				if (oBindingProperties !== undefined) {
					for (i = 0; i < aStatusColumns.length; i++) {
						if (!oBindingProperties.hasOwnProperty(aStatusColumns[i])) {
							sColumns = sColumns + "," + aStatusColumns[i];
						}
					}
				} else {
					for (i = 0; i < aStatusColumns.length; i++) {
						sColumns = sColumns + "," + aStatusColumns[i];
					}
				}
				return sColumns;
			},

			/**
			 * Triggers the binding to the tables,if the view is bound to the model.
			 * Set the busy indicator, until the blocks are loaded with values
			 * @function
			 * @private
			 */
			_onBindingChange: function (a, b) {
				var oView = this.getView(),
					oViewModel = this.getModel("objectView"),
					oElementBinding = oView.getElementBinding(),
					oCurrentOrder;
				if (this.getView().getBindingContext() && this.getView().getBindingContext().getObject()) {
					oCurrentOrder = this.getView().getBindingContext().getObject();
				} else {
					oCurrentOrder = this.getModel().getContext(oElementBinding.getPath()).getObject();
				}

				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("objectNotFound");
					return;
				}
				if (this._bDetailsScreenInitialLoad === false) {
					this.rebindAllTablesOfAllBlocks();
				} else {
					//If order is not a shop floor order then disable serial numbers block
					var oShopFloorItemsModel = this.getView().getModel("shopflooritems");
					if (oCurrentOrder.OrderIsShopFloorOrder === "X") {
						oShopFloorItemsModel.setData([""]);
					} else {
						oShopFloorItemsModel.setData([]);
					}
					this._bDetailsScreenInitialLoad = false;
				}

				if (oCurrentOrder.OrderIsShopFloorOrder === "X" && formatter.getButtonStatus(oCurrentOrder)) {
					//Check of order has an existing order change
					reuseUtil.checkOprHasOpenOrdSpcfcChange(this.getModel("OSR"), oCurrentOrder, function (oData) {
						if (oData.results.length === 0) {
							this.getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldAvailable", true);
							this.getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldAvailable", false);
						} else if (oData.results.length > 0 &&
							oData.results[0].BillOfOperationsGroup !== "" &&
							oData.results[0].BillOfOperationsType !== "" &&
							oData.results[0].BillOfOperationsVariant !== "" &&
							oData.results[0].BillOfOperationsVersion !== "") {
							if (oData.results[0].BillOfOperationsVersionStatus === "10") { //Routing not released
								this.getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldAvailable", false);
								this.getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldAvailable", true);
							} else {
								this.getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldAvailable", true);
								this.getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldAvailable", false);
							}
						}
						//Store the results from order change data
						this.getModel("objectView").setProperty("/oOrderSpecificChangeDetails", oData.results[0]);
					}.bind(this));
				} else {
					this.getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldAvailable", false);
					this.getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldAvailable", false);
				}
				//To reload defects facet
				if (oCurrentOrder.OrderIsShopFloorOrder === "X") {
					var sDefecMsgtListFragmentId = this.getView().createId("idOrderFragDefectMessageStrip");
					var sDefectListFragmentId = this.getView().createId("idObjectFragDefectRecordingList");
					var oDefectsModel = this.getView().getModel("Defects");
					var oFilters = {};
					oFilters.ProductionOrder = oCurrentOrder.ManufacturingOrder;
					this._DefectsClass.setProperties(this, this.getView().getBindingContext(), sDefecMsgtListFragmentId, sDefectListFragmentId,
						oFilters, oDefectsModel);
				}

				// this.rebindAllTablesOfAllBlocks();
				oViewModel.setProperty("/busy", false);
			},

			/** 
			 * Updates the detail model with the latest operation binded to the view.
			 * Also updates the appstate model
			 *  @private
			 */
			updateOrderModel: function () {
				var oModel = this.getView().getModel("DetailModel");
				var oDetailsData = oModel.getData();
				oDetailsData.orderId = this.gsOrderId;
				oDetailsData = this.updateGraphicFlags(oDetailsData);
				oModel.setData(oDetailsData);
				var ioAppStateModel = this.getOwnerComponent().getModel("AppState");
				var aProperties = ioAppStateModel.getProperty("/appState");
				if (oDetailsData.detailPage !== undefined) {
					aProperties.detailPage = oDetailsData;
				} else {
					aProperties.detailPage = oDetailsData.detailPage;
				}

				this.getOwnerComponent().updateAppStateFromAppStateModel();
			},

			updateGraphicFlags: function (oDetailsData) {
				if (oDetailsData.bSequenceTableVisible === undefined && oDetailsData.bSequenceGraphVisible === undefined &&
					oDetailsData.bSequenceGraphRequired === undefined) {
					oDetailsData.bSequenceTableVisible = true;
					oDetailsData.bSequenceGraphVisible = false;
					oDetailsData.bSequenceGraphRequired = true;
				} else if (oDetailsData.bSequenceTableVisible !== undefined && oDetailsData.bSequenceGraphVisible !== undefined &&
					oDetailsData.bSequenceGraphRequired !== undefined) {
					oDetailsData.bSequenceTableVisible = oDetailsData.bSequenceTableVisible;
					oDetailsData.bSequenceGraphVisible = oDetailsData.bSequenceGraphVisible;
					oDetailsData.bSequenceGraphRequired = oDetailsData.bSequenceGraphRequired;
				}
				return oDetailsData;
			},

			/** 
			 * This function rebinds all the tables of all the blocks,
			 * Its kind of notifying the controllers of different blocks
			 * because the controllers of blocks are not been communicated anyway, just binding element in object page.
			 * @private
			 */
			rebindAllTablesOfAllBlocks: function () {
				//OrdDetailHeadHelper.setCurrentView(this.getView());
				var oBindingContext = this.getView().getBindingContext();
				var oModel = this.getView().getModel();
				var sOrderIsShopFloorOrder = oModel.getProperty("OrderIsShopFloorOrder", oBindingContext);
				var bOrderIsShopFloorOrder = sOrderIsShopFloorOrder === "X" ? true : false;

				OrdDetailHeadHelper.rebindAllTablesOfAllBlocks(bOrderIsShopFloorOrder);
				if (!bOrderIsShopFloorOrder) {
					var oShopFloorItemsModel = this.getView().getModel("shopflooritems");
					oShopFloorItemsModel.setData([]);
				}
				var oDetailModel = this.getView().getModel("DetailModel");
				var oDetailModelData = oDetailModel.getData();
				if (oDetailModelData.bSequenceGraphVisible === true) {
					this.reuseUtil.getGraphData(this.getView().getModel(), this.getGraphFilterData());
				}
			},

			/** 
			 * fetches the required filter added to the table
			 * @returns Filter
			 */
			getGraphFilterData: function () {
				var oSelectedItem = this.getView().getBindingContext().getObject();
				var aFilter = [];
				if (oSelectedItem.ManufacturingOrder) {
					aFilter.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, oSelectedItem.ManufacturingOrder));
					aFilter.push(new sap.ui.model.Filter("OperationIsDeleted", sap.ui.model.FilterOperator.NE, "X"));
					aFilter.push(new sap.ui.model.Filter("ManufacturingOrderSubOperation", sap.ui.model.FilterOperator.EQ, ""));
				}
				return aFilter;
			},

			// Function rebindTableOfBlock moved from ObjectController to OrderDetailsHeaderHelper
			// in the commons1 reuse project
			/** 
			 * Rebinds the a table of a perticular block
			 * @param sBlockId - Gives the Block Id
			 * @param sTableId - Gives the table Id whose rebind method is to be called.
			 * @private
			 */
			// rebindTableOfBlock: function(sBlockId, sTableId) {
			// 	var oBlock = this.getView().byId(sBlockId);
			// 	var sViewId = oBlock.getSelectedView();
			// 	if (sViewId) {
			// 		var oBlockView = sap.ui.getCore().byId(sViewId);
			// 		//Reseting segmented button to first button in OrderOperationsBlock
			// 		if (sBlockId === "idOrderOperationsBlock") {
			// 			var oSegmentedBtn = oBlockView.byId("btnSegmntOrderOperation");
			// 			oSegmentedBtn.setSelectedButton(oSegmentedBtn.getButtons()[0]);
			// 		}
			// 		var oSmartTable = oBlockView.byId(sTableId);
			// 		oSmartTable.rebindTable();
			// 	}
			// },

			/**
			 * Handler for Edit order 
			 * This method witll open SAP CO02 transaction in a new tab.
			 * @member i2d.mpe.orders.manages1.controller.Object
			 * @public
			 **/
			handleEditOrderPress: function () {
				// var sOrder = this.getView().getBindingContext().getObject().ManufacturingOrder;
				// reuseUtil.editOrder(sOrder);

				var sOrder = this.getView().getBindingContext().getObject().ManufacturingOrder;

				OrdDetailHeadHelper.handleEditOrderPress(sOrder);
			},

			/**
			 * Handler for Order  confirmation.
			 * this methods will open SAP WEB GUI transaction CO15.
			 * @member i2d.mpe.orders.manages1.controller.Object
			 * @public
			 **/
			handleConfirmOrderPress: function (oEvent) {
				// var sOrder = oEvent.getSource().getModel().oData[this.gsOrderId].ManufacturingOrder;
				// var para = {
				// 	"CORUF-AUFNR": sOrder
				// };
				// var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
				// var oCrossAppNavigator = fgetService && fgetService("CrossApplicationNavigation");
				// // trigger navigation
				// if (oCrossAppNavigator) {
				// 	oCrossAppNavigator.toExternal({
				// 		target: {
				// 			semanticObject: "ProductionOrderConfirmation",
				// 			action: "createOrderConfirmation"
				// 		},
				// 		params: para
				// 	});
				// }

				var sOrder = oEvent.getSource().getModel().oData[this.gsOrderId].ManufacturingOrder;
				var sPara = {
					"CORUF-AUFNR": sOrder
				};
				var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
				var oCrossAppNavigator = fgetService && fgetService("CrossApplicationNavigation");
				var sSemanticObject = "ProductionOrderConfirmation";
				var sAction = "createOrderConfirmation";

				OrdDetailHeadHelper.handleConfirmOrderPress(sPara, oCrossAppNavigator, sSemanticObject, sAction);
			},

			/** 
			 * Handler for status link press, opens a popover which shows the order status information
			 * @param oEvent
			 *  @member i2d.mpe.orders.manages1.controller.Object
			 * @public
			 */
			handleStatusLinkPress: function (oEvent) {
				// OrderOperationStatus.openStatusPopOver(oEvent, this);

				// Object instance is transferred here to OrderDetailsHeaderHelper 
				// because it is needed for the status popover	
				OrdDetailHeadHelper.handleStatusLinkPress(oEvent, this);
			},

			/** 
			 * Handler for material link press, opens a popover which shows the details of the material
			 * @param oEvent
			 *  @member i2d.mpe.orders.manages1.controller.Object
			 * @public
			 */
			handleMaterialLinkPress: function (oEvent) {
				// var oContext = oEvent.getSource().getBindingContext();
				// var oModel = oContext.getModel();
				// var sProductionPlant = oModel.getProperty("ProductionPlant", oContext);
				// var sMaterial = oModel.getProperty("Material", oContext);
				// this.oMaterialPop.openMaterialPopOver(oEvent, this, sMaterial, sProductionPlant);

				var oContext = oEvent.getSource().getBindingContext();
				var oModel = oContext.getModel();
				var sProductionPlant = oModel.getProperty("ProductionPlant", oContext);
				var sMaterial = oModel.getProperty("Material", oContext);
				// var sMRPArea = oModel.getProperty("MRPArea", oContext) || oModel.getProperty("ProductionPlant", oContext);

				// Object instance is transferred here to OrderDetailsHeaderHelper 
				// because it is needed for the material popover
				OrdDetailHeadHelper.handleMaterialLinkPress(oEvent, this, sMaterial, sProductionPlant);
			},

			/** 
			 * Handler for workcenter link press, opens a popover which shows the details of the workcenter
			 * @param oEvent
			 */
			handleWorkCenterPress: function (oEvent) {
				// this.oWorkCenterPop.openWorkCenterPopOver(oEvent, this);

				// Object instance is transferred here to OrderDetailsHeaderHelper 
				// because it is needed for the workcenter popover
				OrdDetailHeadHelper.handleWorkCenterPress(oEvent, this);
			},

			/* Update the model with the latest order id,
			 * On subscribing, using Event bus
			 * @param oEvent -The channel of the event to subscribe to. 
			 * @param oAppstate - The identifier of the event to listen for
			 * @param oData - Contains the oData which is saved in the Appstate model.
			 */
			hanldeAppstateDetailChanges: function (oEvent, oAppstate, oData) {
				var oModel = this.getOwnerComponent().getModel("DetailModel");
				var oOrderDetailData = oModel.getData();
				oOrderDetailData.orderId = oData.orderId;
				oOrderDetailData.bSequenceTableVisible = oData.bSequenceTableVisible;
				oOrderDetailData.bSequenceGraphVisible = oData.bSequenceGraphVisible;
				oOrderDetailData.bSequenceGraphRequired = oData.bSequenceGraphRequired;
				if (oData.selectedOrderData) {
					oOrderDetailData.selectedOrderData = oData.selectedOrderData;
				}
				oModel.setData(oOrderDetailData);
			},

			/**
			 * Unsubscribe the event bus before exiting
			 * @member i2d.mpe.orders.manages1.controller.Object
			 * @public
			 */
			onExit: function () {
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.unsubscribe("AppState", "hanldeAppstateDetailChanges", this.hanldeAppstateDetailChanges, this);
				var oEventBusParams = this.getEventBusParameters();
				//Unsubscribe hold event bus
				oEventBus.unsubscribe(oEventBusParams.ApplyHoldDialog.Channel, oEventBusParams.ApplyHoldDialog.Event, oEventBusParams.ApplyHoldDialog
					.Callback, this);
				//Unsubscribe Release Order anyway event from event bus
				oEventBus.unsubscribe(oEventBusParams.ReleaseOrderAnyway.Channel, oEventBusParams.ReleaseOrderAnyway.Event,
					oEventBusParams.ReleaseOrderAnyway.Callback, this);
			},

			handleReleaseOrderPress: function (oEvent) {
				// var sOrder = oEvent.getSource().getModel().oData[this.gsOrderId].ManufacturingOrder;
				// var oSuccessMessage = {aError:[], aWarning:[]};
				// var oLocalModel = this.getView().getModel();
				// this.oIssuesBlock = this.byId("idIssuesBlock-Collapsed");
				// this.oIssuesBlock.oParentBlock = this.getView().byId("idIssuesSubSection");
				// var mParams = {"method": "POST",
				//         	"urlParameters": {
				//             	"ManufacturingOrder": "" },
				// 	"success": function(oData, response) {
				// 		var oModel;
				// 		var oOrderDetailData;
				// 		var oParentModel;
				// 		var sPath;
				//             	var oResponse = JSON.parse(response.headers["sap-message"]);
				//             	if(oResponse.severity === "error" || oResponse.severity === "warning"){
				//         			if(oResponse.severity === "error"){
				//             			oSuccessMessage.aError.push(oResponse);
				//         			} else {
				//             			oSuccessMessage.aWarning.push(oResponse);
				//         			}
				//             	}
				//             	for(var i = 0; i < oResponse.details.length; i++){
				//             		if(oResponse.details[i].severity === "error" || oResponse.details[i].severity === "warning"){
				//             			if(oResponse.details[i].severity === "error"){
				//         					oSuccessMessage.aError.push(oResponse.details[i]);
				//         				} else {
				//         		  			oSuccessMessage.aWarning.push(oResponse.details[i]);
				//         				}
				//             		}
				//             	}
				//             	var sMessageText,sFinalText,bCompact,z;
				//             	if(oSuccessMessage.aError.length > 0 ){
				//             		sMessageText = this.getI18NText("oneOrderReleaseRequestErrorMSG", [oData.ManufacturingOrder] );
				//                	sFinalText = oSuccessMessage.aError[0].message;
				// 	                for (z = 1; z < oSuccessMessage.aError.length; z++ ){
				//     	              sFinalText = sFinalText + "\n" + oSuccessMessage.aError[z].message;
				//         	        }
				//             	    if(oSuccessMessage.aWarning.length > 0){
				//                 		for (z = 0; z < oSuccessMessage.aWarning.length; z++ ){
				//                 			sFinalText = sFinalText + "\n" + this.getI18NText("WarningInBrackets", oSuccessMessage.aWarning[z].message );
				//                 		}	
				//                 		sMessageText = this.getI18NText("orderReleaseErrorAndWarningMSG", [oSuccessMessage.aError.length, oSuccessMessage.aWarning.length] );
				//                 	}
				//         	        bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				//             	    this.getDynamicMessageBox(sMessageText, MessageBox.Icon.ERROR, this.getI18NText("ErrorPopupTitle"), [MessageBox.Action.CLOSE], "ErrorOrderMSG", sFinalText,bCompact);
				//             	} else if (oSuccessMessage.aWarning.length > 0){
				//                		sMessageText = this.getI18NText("oneOrderReleaseWarningMSG", [oData.ManufacturingOrder] );
				//                	sFinalText = oSuccessMessage.aWarning[0].message;
				// 	                for ( z = 1; z < oSuccessMessage.aWarning.length; z++ ){
				//     	              sFinalText = sFinalText + "\n" + oSuccessMessage.aWarning[z].message;
				//         	        }
				//             	    bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				//                 	this.getDynamicMessageBox(sMessageText, MessageBox.Icon.WARNING , this.getI18NText("WarningPopupTitle"), [MessageBox.Action.CLOSE], "WarningOrderMSG", sFinalText,bCompact);
				//                  this._oOneOrderReleaseButton.setEnabled(false);
				//                  this.rebindAllTablesOfAllBlocks();
				// 			oModel = this.oIssuesBlock.getModel("DetailModel");
				// 			oOrderDetailData = oModel.getData();
				// 			this.oIssuesBlock.sOrderId = oOrderDetailData.orderId;
				// 			oParentModel = this.oIssuesBlock.oParentBlock.getModel();
				// 			sPath = this.oIssuesBlock.oParentBlock.getModel().oData[this.oIssuesBlock.sOrderId];
				// 			formatter.handleIsuesValue(oParentModel, sPath, this.oIssuesBlock);                	    	                    
				// 	            } else {
				//     	          	sMessageText = this.getI18NText("oneOrderReleasedSuccessMSG", [oData.ManufacturingOrder] );
				//         	      	MessageToast.show(sMessageText,{duration:5000});
				//             	    this._oOneOrderReleaseButton.setEnabled(false);
				//             	    this.rebindAllTablesOfAllBlocks();
				//             	   	oModel = this.oIssuesBlock.getModel("DetailModel");
				// 			oOrderDetailData = oModel.getData();
				// 			this.oIssuesBlock.sOrderId = oOrderDetailData.orderId;
				// 			oParentModel = this.oIssuesBlock.oParentBlock.getModel();
				// 			sPath = this.oIssuesBlock.oParentBlock.getModel().oData[this.oIssuesBlock.sOrderId];
				// 			formatter.handleIsuesValue(oParentModel, sPath, this.oIssuesBlock);                	    
				//             	}
				//         	}.bind(this),
				//         	"error": function(oError) {
				//             	MessageToast.show(this.getI18NText("ReleaseFailed"));
				//             	this._oOneOrderReleaseButton.setEnabled(false);
				//         	}
				// };
				// mParams.urlParameters.ManufacturingOrder = sOrder;
				// oLocalModel.callFunction("/C_ManageordersReleaseorder", mParams);

				var sOrder = oEvent.getSource().getModel().oData[this.gsOrderId].ManufacturingOrder;
				//the refresh in the next line is done to get for sure new data on the 
				//production order popover for the status and the current-/ next operation after 
				//the Release Button is triggerd otherwise there is different data on the 
				//worklist and the popover shown if the popover is already opened before  
				//the mentioned button is triggered because data is stored in memory
				this.getModel("PRODORD").refresh(false, true);
				var oLocalModel = this.getView().getModel();
				// var oGlobalLocalModel = new sap.ui.model.json.JSONModel(oLocalModel);
				// this.setModel(oGlobalLocalModel, "globalModel");
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				var oHoldModel = this.getModel("HoldModel");
				this.oIssuesBlock = this.byId("idIssuesBlock-Collapsed");
				this.oIssuesBlock.oParentBlock = this.getView().byId("idIssuesSubSection");
				//below code refreshes the model of header content, so that STATUS can get updated when release is success
				var headerId = this.getView().byId("idOrderObjectPageLayout-OPHeaderContent");
				//OrdDetailHeadHelper.setCurrentView(this.getView());
				OrdDetailHeadHelper.handleReleaseOrderPress(headerId, sOrder, oLocalModel, this.oIssuesBlock, bCompact, oHoldModel);
				// adding event bus for release anyway functionality
				var oEventBus = sap.ui.getCore().getEventBus();
				var oEventBusParams = this.getEventBusParameters();
				OrdDetailHeadHelper.setEventBusParameters(oEventBus, oEventBusParams.ReleaseOrderAnyway.Channel,
					oEventBusParams.ReleaseOrderAnyway.Event);
			},

			handleOrderHoldButton: function (oEvent) {
				var oContext = oEvent.getSource().getBindingContext();
				var oModel = oContext.getModel();
				var sOrder = oEvent.getSource().getModel().oData[this.gsOrderId].ManufacturingOrder;
				var sPlant = oModel.getProperty("ProductionPlant", oContext);
				var sMaterial = oModel.getProperty("Material", oContext);
				var oLocalModel = this.getView().getModel();
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				this.oIssuesBlock = this.byId("idIssuesBlock-Collapsed");
				this.oIssuesBlock.oParentBlock = this.getView().byId("idIssuesSubSection");

				var oHoldObject = {
					ManufacturingOrder: sOrder,
					ProductionPlant: sPlant,
					Material: sMaterial
						//OrderInternalID: 
						//OrderOperationInternalID: 
						//ShopFloorItem: 
						//Workcenter: 
				};
				var aHoldTypesRequired = [ReuseProjectConstants.HOLD.TYPE_ORDER, ReuseProjectConstants.HOLD.TYPE_MATERIAL];
				ApplyHoldDialog.setResourceModel(this._oCommonsI18nModel);
				ApplyHoldDialog.initAndOpen(oHoldObject, this.getModel("HoldModel"), aHoldTypesRequired, undefined, ReuseProjectConstants.HOLD.TYPE_ORDER,
					false);
			},

			getEventBusParameters: function () {
				// define events' details here for which event bus will be subscribed
				var oEventBusParams = {
					ApplyHoldDialog: {
						Channel: "sap.i2d.mpe.orders.manages1.Worklist",
						Event: "onHoldSuccessfullyApplied",
						Callback: this.onHoldSuccessfullyComplete
					},
					ReleaseOrderAnyway: {
						Channel: "sap.i2d.mpe.orders.manages1.Object",
						Event: "onReleaseOrderAnywayAppliedDetails",
						Callback: this.onReleaseOrderAnywayCallback
					}
				};
				return oEventBusParams;
			},

			onReleaseOrderAnywayCallback: function (sChannelId, sEventId, oResponse) {

				var sOrder = this.getView().getModel().oData[this.gsOrderId].ManufacturingOrder;
				//the refresh in the next line is done to get for sure new data on the 
				//production order popover for the status and the current-/ next operation after 
				//the Release Button is triggerd otherwise there is different data on the 
				//worklist and the popover shown if the popover is already opened before  
				//the mentioned button is triggered because data is stored in memory
				this.getModel("PRODORD").refresh(false, true);
				var oLocalModel = this.getView().getModel();
				var bCompact;
				if (this.getView().$) {
					bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				}
				var oHoldModel = this.getModel("HoldModel");
				this.oIssuesBlock = this.byId("idIssuesBlock-Collapsed");
				this.oIssuesBlock.oParentBlock = this.getView().byId("idIssuesSubSection");
				//below code refreshes the model of header content, so that STATUS can get updated when release is success
				var headerId = this.getView().byId("idOrderObjectPageLayout-OPHeaderContent");
				OrdDetailHeadHelper.handleReleaseOrderPress(headerId, sOrder, oLocalModel, this.oIssuesBlock, bCompact, oHoldModel, true);
				OrdDetailHeadHelper.setEventBusParameters();
			},

			onHoldSuccessfullyComplete: function (sChannelId, sEventId, oResponse) {
				var sMessageText, sFinalText;
				if (oResponse.success) {
					sMessageText = oResponse.info;
					MessageToast.show(sMessageText);
					this.rebindAllTablesOfAllBlocks();
				} else {
					var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
					sMessageText = oResponse.info;
					this.getDynamicMessageBox(sMessageText, MessageBox.Icon.ERROR, "Error", [MessageBox.Action.CLOSE], "ErrorOrderMSG", sFinalText,
						bCompact);
				}
			},
			/** 
			 * getDynamicMessageBox method gets the Message box control with dynamic inputs
			 * @public
			 * @param {string} sMessageText for initial message on message box.
			 * @param {icon} icon type for success or warning or error.
			 * @param {stitle} Title for message box.
			 * @param {Message.Action} Actions to execute after click event
			 * @param {string} id for message box.
			 * @param {string} sFinalText is final text to be displayed into message box.
			 * @param {int} length for compact style class
			 */
			getDynamicMessageBox: function (sMessageText, icon, stitle, actions, id, sFinalText, bCompact) {
				//	MessageBox.show(sMessageText, {
				// 	icon: icon? icon : MessageBox.Icon.NONE,
				// 	title: stitle ? stitle : "",
				// 	actions: actions ? actions : MessageBox.Action.OK,
				// 	id: id ? id : "DefaultMessageBoxId",
				// 	details: sFinalText ? sFinalText : "Error",
				// 	styleClass: bCompact? "sapUiSizeCompact" : ""
				// });

				OrdDetailHeadHelper.getDynamicMessageBox(sMessageText, icon, stitle, actions, id, sFinalText, bCompact);
			},
			handleRereadButtonPress: function (oEvent) {
				var sOrder = oEvent.getSource().getModel().oData[this.gsOrderId].ManufacturingOrder;
				//the refresh in the next line is done to get for sure new data on the 
				//production order popover for the status and the current-/ next operation after 
				//the Reread Button is triggerd otherwise there is different data on the 
				//worklist and the popover shown if the popover is already opened before  
				//the mentioned button is triggered because data is stored in memory
				this.getModel("PRODORD").refresh(false, true);
				var oLocalModel = this.getView().getModel();
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				var oViewModel = this.getModel("objectView");
				var oHoldModel = this.getModel("HoldModel");

				this.oIssuesBlock = this.byId("idIssuesBlock-Collapsed").getController();
				// this.oIssuesBlock.oParentBlock = this.getView().byId("idIssuesSubSection");
				OrdDetailHeadHelper.handleRereadButtonPress(sOrder, oLocalModel, this.oIssuesBlock, bCompact, oViewModel, oHoldModel);
			},
			onPressGoToConfigPage: function (oEvent) {
				var oContext = oEvent.getSource().getBindingContext();
				var oModel = oContext.getModel();
				var sOrder = this.getView().getBindingContext().getObject().ManufacturingOrder;
				var sProductConfiguration = oModel.getProperty("ProductConfiguration", oContext);
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("Configuration", {
					orderId: sOrder
				});
			},

			onPressOrdSpcfcChange: function () {
				OrdSpcfcChange.initAndOpen({
					oHoldModel: this.getView().getModel("HoldModel"),
					oCRModel: this.getView().getModel("CR"),
					oOSRModel: this.getView().getModel("OSR"),
					oSelectedOrder: this.getView().getBindingContext().getObject(),
					oOrderSpecificChangeDetails: this.getView().getModel("objectView").getProperty("/oOrderSpecificChangeDetails"),
					oCallBack: this.onOrdSpcfcChangeCallBackObject.bind(this),
					Ischangeforwholeorder: true
				});
			},

			onPressDisplayOrdScpfcChange: function (oEvent) {
				NavHelper.navToShopFloorRoutingChange(this.getView().getModel("objectView").getProperty("/oOrderSpecificChangeDetails"));
			},

			onPressOkRelatedOrders: function (oEvent) {

				this._oRelatedOrdersDialog.close();

			},

			onPressGraphRelatedOrders: function (oEvent) {

				sap.ui.getCore().byId("idRelatedOrdersInnerTable").setVisible(false);
				sap.ui.getCore().byId("idRelatedOrdersSmartTable").setShowRowCount(false);
				sap.ui.getCore().byId("idRelatedOrdersGraph").setVisible(true);
				sap.ui.getCore().byId("idRelatedOrdersTableButton").setPressed(false);

				var that = this;
				var sSplitOrderDetailPath = "/C_MfgOrderSplitOrderDetail";
				var sSplitOrderDetailPathWithCurrentOrder = that.getView().getModel().createKey(sSplitOrderDetailPath, {
					ManufacturingOrder: this.getView().getModel("RelatedOrdersData").getProperty("/ManufacturingOrder")
				});
				var oFilter;
				var aFilters = [];

				if (this.getView().getModel("RelatedOrdersData").getProperty("/MfgOrderSplitStatus") === "2") {
					this.getView().getModel().read(sSplitOrderDetailPathWithCurrentOrder, {
						success: function (oDataForLeadingOrder) {

							that.getView().getModel("RelatedOrdersData").setProperty("/MfgOrderSplitLeadingOrder", oDataForLeadingOrder.MfgOrderSplitLeadingOrder);

							oFilter = new sap.ui.model.Filter("MfgOrderSplitLeadingOrder", sap.ui.model.FilterOperator.EQ, that.getView().getModel(
								"RelatedOrdersData").getProperty("/MfgOrderSplitLeadingOrder"));
							aFilters = [];
							aFilters.push(oFilter);
							that.getView().getModel().read(sSplitOrderDetailPath, {
								filters: aFilters,
								success: function (oData) {

									var aResults = oData.results;
									var bIsCurrentOrder = false;

									if (aResults.length > 0) {

										for (var i = 0; i < aResults.length; i++) {

											if (aResults[i].ManufacturingOrder === that.getView().getModel("RelatedOrdersData").getProperty("/ManufacturingOrder")) {
												bIsCurrentOrder = true;
											}

											sap.ui.getCore().byId("idRelatedOrdersGraph").addNode(new sap.suite.ui.commons.networkgraph.Node({
												key: i,
												title: aResults[i].ManufacturingOrder,
												shape: "Box",
												selected: bIsCurrentOrder,
												"attributes": [{
													"label": that.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersMaterial"),
													"value": aResults[i].Material
												}, {
													"label": that.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersOrderType"),
													"value": aResults[i].ManufacturingOrderType
												}, {
													"label": that.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersWBS"),
													"value": aResults[i].WBSElement
												}, {
													"label": that.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersQuantityColumn"),
													"value": aResults[i].MfgOrderPlannedTotalQty
												}]
											}));

											bIsCurrentOrder = false;

											for (var j = 0; j < aResults.length; j++) {

												if (aResults[j].MfgOrderSplitParentOrder === aResults[i].ManufacturingOrder) {

													sap.ui.getCore().byId("idRelatedOrdersGraph").addLine(new sap.suite.ui.commons.networkgraph.Line({
														from: i,
														to: j
													}));

												}

											}
										}

									}

								},
								error: function (oError) {
									jQuery.sap.log.error(oError.responseText);
								}
							});

						},
						error: function (oError) {
							jQuery.sap.log.error(oError.responseText);
						}
					});
				} else {

					oFilter = new sap.ui.model.Filter("MfgOrderSplitLeadingOrder", sap.ui.model.FilterOperator.EQ, this.getView().getModel(
						"RelatedOrdersData").getProperty("/MfgOrderSplitLeadingOrder"));
					aFilters = [];
					aFilters.push(oFilter);
					this.getView().getModel().read(sSplitOrderDetailPath, {
						filters: aFilters,
						success: function (oData) {

							var aResults = oData.results;
							var bIsCurrentOrder = false;

							if (aResults.length > 0) {

								for (var i = 0; i < aResults.length; i++) {

									if (aResults[i].ManufacturingOrder === that.getView().getModel("RelatedOrdersData").getProperty("/ManufacturingOrder")) {
										bIsCurrentOrder = true;
									}

									sap.ui.getCore().byId("idRelatedOrdersGraph").addNode(new sap.suite.ui.commons.networkgraph.Node({
										key: i,
										title: aResults[i].ManufacturingOrder,
										shape: "Box",
										selected: bIsCurrentOrder,
										"attributes": [{
											"label": that.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersMaterial"),
											"value": aResults[i].Material
										}, {
											"label": that.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersOrderType"),
											"value": aResults[i].ManufacturingOrderType
										}, {
											"label": that.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersWBS"),
											"value": aResults[i].WBSElement
										}, {
											"label": that.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersQuantityColumn"),
											"value": aResults[i].MfgOrderPlannedTotalQty
										}]
									}));

									bIsCurrentOrder = false;

									for (var j = 0; j < aResults.length; j++) {

										if (aResults[j].MfgOrderSplitParentOrder === aResults[i].ManufacturingOrder) {

											sap.ui.getCore().byId("idRelatedOrdersGraph").addLine(new sap.suite.ui.commons.networkgraph.Line({
												from: i,
												to: j
											}));

										}

									}
								}

							}

						},
						error: function (oError) {
							jQuery.sap.log.error(oError.responseText);
						}
					});
				}

			},

			onPressTableRelatedOrders: function (oEvent) {

				sap.ui.getCore().byId("idRelatedOrdersInnerTable").setVisible(true);
				sap.ui.getCore().byId("idRelatedOrdersSmartTable").setShowRowCount(true);
				sap.ui.getCore().byId("idRelatedOrdersGraph").setVisible(false);
				sap.ui.getCore().byId("idRelatedOrdersNetworkGraphButton").setPressed(false);
				sap.ui.getCore().byId("idRelatedOrdersGraph").destroyAllElements();

			},

			onPressDisplayRelatedOrders: function () {

				var sManufacturingOrderPath = this.getView().getBindingContext();
				var sSplitOrderPath = "/I_MfgOrderSplitParentOrderDet";
				var that = this;

				if (!this._oRelatedOrdersDialog) {

					var oRelatedOrdersDialog = new sap.ui.core.Fragment.load({
						name: "i2d.mpe.orders.manages1.fragments.RelatedOrdersDialog",
						controller: this
					});

					oRelatedOrdersDialog.then(function (oSource) {

						that._oRelatedOrdersDialog = oSource;

						var oModelSettings = new JSONModel({
							source: "atomicCircle",
							orientation: "LeftRight",
							arrowPosition: "End",
							arrowOrientation: "ParentOf",
							nodeSpacing: 55,
							mergeEdges: false
						});

						var oModelGraph = new JSONModel({
							nodes: [],
							lines: [],
							groups: []
						});

						var oModelRelatedOrders = new JSONModel({
							MfgOrderSplitLeadingOrder: "",
							ManufacturingOrder: that.getView().getModel().getProperty(sManufacturingOrderPath + "/ManufacturingOrder"),
							MfgOrderSplitStatus: that.getView().getModel().getProperty(sManufacturingOrderPath + "/MfgOrderSplitStatus")
						});

						that.getView().setModel(oModelGraph, "RelatedOrdersGraph");
						that.getView().setModel(oModelSettings, "RelatedOrderGraphSettings");
						that.getView().setModel(oModelRelatedOrders, "RelatedOrdersData");
						if (that.getView().getModel("RelatedOrdersData").getProperty("/MfgOrderSplitStatus") === "2") {
							sap.ui.getCore().byId("idRelatedOrdersSmartTable").setEnableAutoBinding(false);
						} else {
							sap.ui.getCore().byId("idRelatedOrdersSmartTable").setEnableAutoBinding(true);
						}
						that.getView().addDependent(oSource);

						var sRelatedOrderPath = that.getView().getModel().createKey(sSplitOrderPath, {
							ManufacturingOrder: that.getView().getModel("RelatedOrdersData").getProperty("/ManufacturingOrder")
						});

						oSource.bindElement(sRelatedOrderPath);

						oSource.open();
					});

				} else {

					if (this.getView().getModel().getProperty(sManufacturingOrderPath + "/ManufacturingOrder") !== this.getView().getModel(
							"RelatedOrdersData").getProperty("/ManufacturingOrder")) {

						sap.ui.getCore().byId("idRelatedOrdersInnerTable").setVisible(true);
						sap.ui.getCore().byId("idRelatedOrdersSmartTable").setShowRowCount(true);
						sap.ui.getCore().byId("idRelatedOrdersGraph").setVisible(false);
						sap.ui.getCore().byId("idRelatedOrdersNetworkGraphButton").setPressed(false);
						sap.ui.getCore().byId("idRelatedOrdersTableButton").setPressed(true);
						sap.ui.getCore().byId("idRelatedOrdersGraph").destroyAllElements();
						sap.ui.getCore().byId("idRelatedOrdersSmartTable").rebindTable(true);

						this.getView().getModel("RelatedOrdersData").setProperty("/ManufacturingOrder", this.getView().getModel().getProperty(
							sManufacturingOrderPath + "/ManufacturingOrder"));
						this.getView().getModel("RelatedOrdersData").setProperty("/MfgOrderSplitStatus", this.getView().getModel().getProperty(
							sManufacturingOrderPath + "/MfgOrderSplitStatus"));

						var sChangedRelatedOrderPath = this.getView().getModel().createKey(sSplitOrderPath, {
							ManufacturingOrder: this.getView().getModel("RelatedOrdersData").getProperty("/ManufacturingOrder")
						});

						this._oRelatedOrdersDialog.bindElement(sChangedRelatedOrderPath);
					} else {
						sap.ui.getCore().byId("idRelatedOrdersInnerTable").setVisible(true);
						sap.ui.getCore().byId("idRelatedOrdersSmartTable").setShowRowCount(true);
						sap.ui.getCore().byId("idRelatedOrdersGraph").setVisible(false);
						sap.ui.getCore().byId("idRelatedOrdersNetworkGraphButton").setPressed(false);
						sap.ui.getCore().byId("idRelatedOrdersTableButton").setPressed(true);
						sap.ui.getCore().byId("idRelatedOrdersGraph").destroyAllElements();
						sap.ui.getCore().byId("idRelatedOrdersSmartTable").rebindTable(true);
					}

					this._oRelatedOrdersDialog.open();
				}

			},

			onSerialNumbersLinkPress: function (oEvent) {
				var oItemBindingContext = oEvent.getSource().getBindingContext();
				var that = this;

				var oUsersData = new sap.ui.model.json.JSONModel({
					"I_SerialNumberManufacturingOrd": []
				});

				// create popover
				if (!this._oPopoverSerialNumbers) {
					this._oPopoverSerialNumbers = sap.ui.xmlfragment("i2d.mpe.orders.manages1.fragments.SerialNumbersPopover", this);
					this._oPopoverSerialNumbers.setModel(this.getView().getModel("i18n"), "i18n");
				}

				this._oPopoverSerialNumbers.openBy(oEvent.getSource());

				this.getView().getModel().read(oItemBindingContext.getPath(), {
					urlParameters: {
						"$expand": "to_SerialNumberManufacturingOrd"
					},
					success: function (oData) {
						oUsersData.getProperty("/I_SerialNumberManufacturingOrd").push.apply(oUsersData.getProperty("/I_SerialNumberManufacturingOrd"),
							oData.to_SerialNumberManufacturingOrd
							.results);
						that._oPopoverSerialNumbers.setModel(oUsersData);
					},
					error: function (oError) {
						jQuery.sap.log.error(oError.responseText);
					}
				});
			},

			onBeforeRebindRelatedOrdersTable: function (oEvent) {
				var mBindingParams = oEvent.getParameter("bindingParams");
				var that = this;

				mBindingParams.events = {
					"dataReceived": function (oEvent1) {
						if (oEvent1.getParameter('data')['results'].length > 0) {
							var sMfgOrderSplitLeadingOrder = oEvent1.getParameter('data')['results'][0].MfgOrderSplitLeadingOrder;
							that.getView().getModel("RelatedOrdersData").setProperty("/MfgOrderSplitLeadingOrder", sMfgOrderSplitLeadingOrder);
						}
					}
				};

				var sPath = this.getView().getBindingContext();
				var oFilter = new sap.ui.model.Filter("MfgOrderSplitParentOrder", sap.ui.model.FilterOperator.EQ, this.getView().getModel().getProperty(
					sPath + "/ManufacturingOrder"));
				mBindingParams.filters.push(oFilter);
			},

			onOrdSpcfcChangeCallBackObject: function (oData) {
				this.getView().getModel("objectView").setProperty("/oOrderSpecificChangeDetails", oData);
				this.getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldAvailable", false);
				this.getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldAvailable", true);
			},

			onPressOrderSplit: function (oEvent) {
				OrderSplitDialog.initAndOpen({
					oi18nModel: this.getView().getModel("i18n"),
					oDataModel: this.getView().getModel(),
					oParentController: this,
					oSelectedOrder: this.getView().getBindingContext().getObject(),
					oSelectedOperation: this.getView().getModel("objectView").getProperty("/OperationForOrderSplit"),
					sSelectedButtonKey: oEvent.getSource().getKey()
				});
			}

		});
	});
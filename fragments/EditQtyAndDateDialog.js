/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/resource/ResourceModel","sap/ui/model/json/JSONModel","sap/m/MessageBox","sap/i2d/mpe/lib/commons1/utils/constants","sap/i2d/mpe/lib/commons1/utils/formatter","sap/m/MessageStrip"],function(R,J,M,C,a){"use strict";return{initAndOpen:function(b,n,o){var m=this._getPopOverResourceBundle();var r=m.getResourceBundle();if(!this._oDialog){this._oDialog=sap.ui.xmlfragment("idEditQtyAndDateDialog","i2d.mpe.orders.manages1.fragments.EditQtyAndDateDialog",this);this._oDialog.setModel(m,"i18n");this._oDialog.attachEvent("afterClose",$.proxy(function(){this._oDialog.destroy();this._oDialog=undefined;},this));b.SchedulingType=this.getSchedulingTypes(r);b.PlannedTotalQtyValueState="None";b.PlannedScrapQtyValueState="None";b.PlannedStartDateValueState="None";b.PlannedEndDateValueState="None";b.BasicSchedulingTypeValueState="None";this._oDialog._oBaseObject=b;this._oDialog.setModel(n);var d=new J(b);this._oDialog.setModel(d,"EditQtyAndDateData");this._oDialog.bindElement({path:o,events:{dataRequested:function(){this._oDialog.getModel("EditQtyAndDateData").setProperty("/busy",true);}.bind(this),dataReceived:function(){this._oDialog.getModel("EditQtyAndDateData").setProperty("/busy",false);}.bind(this)}});}this._openDialog();var c=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateComboBox");var s=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseStart");var e=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseEnd");var w=sap.ui.getCore().byId("idEditQtyAndDateDialog--idStartWarningMessageCurrent");var f=sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageCurrent");var g=sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageForward");var h=sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageBackward");if(c.getSelectedKey()==="4"){s.setEnabled(false);s.setValueState(sap.ui.core.ValueState.None);e.setEnabled(false);e.setValueState(sap.ui.core.ValueState.None);w.setVisible(true);f.setVisible(true);g.setVisible(false);h.setVisible(false);}else if(c.getSelectedKey()==="1"||c.getSelectedKey()==="5"){e.setEnabled(false);e.setValueState(sap.ui.core.ValueState.None);g.setVisible(true);f.setVisible(false);w.setVisible(false);h.setVisible(false);s.setEnabled(true);}else if(c.getSelectedKey()==="2"||c.getSelectedKey()==="6"){s.setEnabled(false);s.setValueState(sap.ui.core.ValueState.None);g.setVisible(true);f.setVisible(false);w.setVisible(false);g.setVisible(false);e.setEnabled(true);}else{s.setEnabled(true);e.setEnabled(true);e.setValueState(sap.ui.core.ValueState.None);w.setVisible(false);f.setVisible(false);g.setVisible(false);h.setVisible(false);}var S=sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");var p=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateScrapPortion");var i=sap.ui.getCore().byId("idEditQtyAndDateDialog--ScrapQtyErrorValidation");if(S.setEnabled===false){p.setValueState("None");S.setEnabled(true);i.setVisible(false);}},getSchedulingTypes:function(r){return[{id:"1",name:r.getText("schedulingType_forwards")},{id:"2",name:r.getText("schedulingType_backwards")},{id:"3",name:r.getText("schedulingType_onlyCapacityRequirements")},{id:"4",name:r.getText("schedulingType_currentDate")},{id:"5",name:r.getText("schedulingType_ForwardsInTime")},{id:"6",name:r.getText("schedulingType_BackwardsInTime")}];},setEventBusParameters:function(e,E,s){this.oEventBus=e;this.sDialogEventChannel=E;this.sEventId=s;},_openDialog:function(){this._oDialog.open();},_getPopOverResourceBundle:function(){var i=jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1")+"/"+"i18n/i18n.properties";var r=new R({bundleUrl:i});return r;},onPressSaveEditQtyAndDate:function(e){var d=this._oDialog.getModel("EditQtyAndDateData");var p=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateOrderQty");var P=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateScrapPortion");var o=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseStart");var b=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseEnd");var s=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateComboBox");var c=this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType");var f=c-1;var A=true;if((p.getValue()===null)||(p.getValue()===undefined)||(p.getValue()==="")||(p.getValue()<=0)){d.setProperty("/PlannedTotalQtyValueState","Error");A=false;p.focus();return;}else{d.setProperty("/PlannedTotalQtyValueState","None");A=true;p.focus();}if((c===null)||(c===undefined)||(c==="")||(f<"0")){d.setProperty("/BasicSchedulingTypeValueState","Error");A=false;s.focus();return;}else{d.setProperty("/BasicSchedulingTypeValueState","None");A=true;s.focus();}if((c==="1")){if((o.getDateValue()===null)||(o.getDateValue()===undefined)||(o.getDateValue()==="")){d.setProperty("/PlannedStartDateValueState","Error");A=false;o.focus();return;}else{d.setProperty("/PlannedStartDateValueState","None");A=true;o.focus();}}if((c==="2")){if((b.getDateValue()===null)||(b.getDateValue()===undefined)||(b.getDateValue()==="")){d.setProperty("/PlannedEndDateValueState","Error");A=false;b.focus();return;}else{d.setProperty("/PlannedEndDateValueState","None");A=true;b.focus();}if((o.getDateValue()!==null)||(o.getDateValue()!==undefined)||(o.getDateValue()!=="")){}}if((c==="3")){if((o.getDateValue()===null)||(o.getDateValue()===undefined)||(o.getDateValue()==="")){d.setProperty("/PlannedStartDateValueState","Error");A=false;o.focus();return;}else{d.setProperty("/PlannedStartDateValueState","None");A=true;o.focus();}if((b.getDateValue()===null)||(b.getDateValue()===undefined)||(b.getDateValue()==="")){d.setProperty("/PlannedEndDateValueState","Error");A=false;b.focus();return;}else{d.setProperty("/PlannedEndDateValueState","None");A=true;b.focus();}if(Date.parse(o.getDateValue())>Date.parse(b.getDateValue())){d.setProperty("/PlannedStartDateValueState","Error");A=false;o.focus();return;}else{d.setProperty("/PlannedStartDateValueState","None");A=true;o.focus();}}if((c==="4")){if((o.getDateValue()===null)||(o.getDateValue()===undefined)||(o.getDateValue()==="")){d.setProperty("/PlannedStartDateValueState","Error");A=false;o.focus();return;}else{d.setProperty("/PlannedStartDateValueState","None");A=true;o.focus();}if(Date.parse(o.getDateValue())>Date.parse(b.getDateValue())){d.setProperty("/PlannedStartDateValueState","Error");A=false;o.focus();return;}else{d.setProperty("/PlannedStartDateValueState","None");A=true;o.focus();}}if((c==="5")){if((o.getDateValue()===null)||(o.getDateValue()===undefined)||(o.getDateValue()==="")){d.setProperty("/PlannedStartDateValueState","Error");A=false;o.focus();return;}else{d.setProperty("/PlannedStartDateValueState","None");A=true;o.focus();}}if((c==="6")){if((b.getDateValue()===null)||(b.getDateValue()===undefined)||(b.getDateValue()==="")){d.setProperty("/PlannedEndDateValueState","Error");A=false;b.focus();return;}else{d.setProperty("/PlannedEndDateValueState","None");A=true;b.focus();}}if(A){var D=this._oDialog.getBindingContext().getObject(),g,h,i,j;this._oDialog.getModel("EditQtyAndDateData").setProperty("/busy",true);if(o.getDateValue()!==null){g=o.getDateValue();h=new Date(Date.UTC(g.getFullYear(),g.getMonth(),g.getDate()));}if(b.getDateValue()!==null){i=b.getDateValue();j=new Date(Date.UTC(i.getFullYear(),i.getMonth(),i.getDate()));}var n=sap.ui.core.format.NumberFormat.getInstance({style:"full"});var k=n.parse(p.getValue());var l=P.getValue()!==""?n.parse(P.getValue()):"0.00";var u={ManufacturingOrder:this._oDialog._oBaseObject.hasOwnProperty("ManufacturingOrder")?this._oDialog._oBaseObject.ManufacturingOrder:"",MfgOrderPlannedTotalQty:k,MfgOrderPlannedScrapQty:l,ProductionUnit:D.ProductionUnit,MfgOrderPlannedStartDate:h?h:undefined,MfgOrderPlannedStartTime:D.MfgOrderPlannedStartTime,MfgOrderPlannedEndDate:j?j:undefined,MfgOrderPlannedEndTime:D.MfgOrderPlannedEndTime,BasicSchedulingType:c};this._oDialog.getModel().callFunction("/C_ManageProductionOrderUpdateorder",{method:"POST",urlParameters:u,success:this._onSuccessEditQtyAndDate.bind(this),error:this._onErrorEditQtyAndDate.bind(this)});}},_onChangeOderQuantity:function(){var d=this._oDialog.getModel("EditQtyAndDateData");var p=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateOrderQty");if((p.getValue()===null)||(p.getValue()===undefined)||(p.getValue()==="")||(p.getValue()<=0)){d.setProperty("/PlannedTotalQtyValueState","Error");p.focus();return;}else{d.setProperty("/PlannedTotalQtyValueState","None");p.focus();}},_onChangeScrapQuantity:function(){var r=/^-/;var p=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateScrapPortion");var s=sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");var P=p.getValue();var l=(P.trim()).length;if(l<=0){p.setValue("0");}if(P.match(r)){var o=this._getPopOverResourceBundle().getResourceBundle();p.setValueState("Error");p.setValueStateText(o.getText("scrpQtyNoNegative"));s.setEnabled(false);}else{p.setValueState("None");s.setEnabled(true);}},_onChangeStartDatePicker:function(e){var s=sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");var d=e.getSource();var v=e.getParameter("valid");if(v){d.setValueState(sap.ui.core.ValueState.None);s.setEnabled(true);if(this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType")==="4"){sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseStart").setEnabled(false);}}else{d.setValueState(sap.ui.core.ValueState.Error);s.setEnabled(false);}},_onChangeEndDatePicker:function(e){var s=sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");var d=e.getSource();var v=e.getParameter("valid");if(v){d.setValueState(sap.ui.core.ValueState.None);s.setEnabled(true);}else{d.setValueState(sap.ui.core.ValueState.Error);s.setEnabled(false);}},_onChangeSchedulingType:function(){var d=this._oDialog.getModel("EditQtyAndDateData");var s=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateComboBox");var b=this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType");var c=b-1;var S=sap.ui.getCore().byId("idEditQtyAndDateDialog--saveEditQtyAndDateBtn");S.setEnabled(true);if((b===null)||(b===undefined)||(b==="")||(c<"0")){d.setProperty("/BasicSchedulingTypeValueState","Error");s.focus();return;}else{d.setProperty("/BasicSchedulingTypeValueState","None");s.focus();}var e=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseStart");var f=sap.ui.getCore().byId("idEditQtyAndDateDialog--EditQtyAndDateBaseEnd");var w=sap.ui.getCore().byId("idEditQtyAndDateDialog--idStartWarningMessageCurrent");var g=sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageCurrent");var h=sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageForward");var i=sap.ui.getCore().byId("idEditQtyAndDateDialog--idEndWarningMessageBackward");if(this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType")==="4"){e.setEnabled(false);f.setEnabled(false);w.setVisible(true);g.setVisible(true);h.setVisible(false);i.setVisible(false);}else if(this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType")==="1"||this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType")==="5"){f.setEnabled(false);h.setVisible(true);g.setVisible(false);w.setVisible(false);i.setVisible(false);e.setEnabled(true);}else if(this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType")==="2"||this._oDialog.getModel("EditQtyAndDateData").getProperty("/BasicSchedulingType")==="6"){e.setEnabled(false);i.setVisible(true);g.setVisible(false);w.setVisible(false);h.setVisible(false);f.setEnabled(true);}else{e.setEnabled(true);f.setEnabled(true);w.setVisible(false);g.setVisible(false);h.setVisible(false);i.setVisible(false);}},onPressCancelEditQtyAndDate:function(){this._oDialog.close();},_onSuccessEditQtyAndDate:function(d,r){var o=this._getPopOverResourceBundle().getResourceBundle();var b;if(r.headers["sap-message"]){b=JSON.parse(r.headers["sap-message"]);}var s={aError:[],aWarning:[]};var f;var m;var S=true;if(b){if(b.severity==="error"||b.severity==="warning"){S=false;if(b.severity==="error"){s.aError.push(b);m=b.message;f=s.aError[0].message;}else if(b.severity==="warning"){b.order=d.ManufacturingOrder;m=b.message;s.aWarning.push(b);f=s.aWarning[0].message;}var e={success:false,info:m,detail:f};this.oEventBus.publish(this.sDialogEventChannel,this.sEventId,e);}}if(S===true){m=b.message;if(this.oEventBus){var c={success:true,info:m};this._oDialog.close();this.oEventBus.publish(this.sDialogEventChannel,this.sEventId,c);}}this._oDialog.getModel("EditQtyAndDateData").setProperty("/busy",false);},_onErrorEditQtyAndDate:function(r){var o,f,i;if(r.responseText.indexOf("<?xml")!==-1){f=r;i=this._getPopOverResourceBundle().getResourceBundle().getText("errorText");}else{o=JSON.parse(r.responseText);f=r.message;i=o.error.message.value;}if(this.oEventBus){var e={success:false,info:i,detail:f};this.oEventBus.publish(this.sDialogEventChannel,this.sEventId,e);}this._oDialog.close();}};});
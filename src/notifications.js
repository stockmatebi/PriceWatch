import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken } from './api';

Notifications.setNotificationHandler({handleNotification:async()=>({shouldPlaySound:false,shouldSetBadge:false,shouldShowBanner:true,shouldShowList:true})});
export async function registerForPushNotificationsAsync(){
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('price-alerts',{name:'Price alerts',importance:Notifications.AndroidImportance.DEFAULT,vibrationPattern:[0,250,250,250],lightColor:'#F5BE28'});
 const p=await Notifications.getPermissionsAsync();let status=p.status;
 if(status!=='granted')status=(await Notifications.requestPermissionsAsync()).status;
 if(status!=='granted')return{enabled:false,reason:'permission_denied'};
 const projectId=Constants.expoConfig?.extra?.eas?.projectId;
 if(!projectId||projectId==='REPLACE_WITH_EAS_PROJECT_ID')return{enabled:false,reason:'eas_project_id_missing'};
 const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
 await registerPushToken(token,Platform.OS);return{enabled:true,token};
}

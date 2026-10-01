import React from 'react';
import {SafeAreaView,StatusBar,StyleSheet,Text,View} from 'react-native';

export default function App(){
  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content" backgroundColor="#121417"/>
    <View style={styles.container}>
      <Text style={styles.logo}>PRICE WATCH</Text>
      <Text style={styles.title}>Price Watch</Text>
      <Text style={styles.subtitle}>Fresh Android build</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>App startup test</Text>
        <Text style={styles.cardText}>If you can see this screen, the new clean Android foundation is working.</Text>
      </View>
    </View>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#121417'},
 container:{flex:1,alignItems:'center',justifyContent:'center',padding:24},
 logo:{fontSize:28,fontWeight:'800',color:'#F5BE28',letterSpacing:2},
 title:{fontSize:34,fontWeight:'700',color:'#fff',marginTop:10},
 subtitle:{fontSize:16,color:'#aeb4bc',marginTop:6},
 card:{width:'100%',marginTop:36,padding:22,borderRadius:16,backgroundColor:'#1d2127'},
 cardTitle:{fontSize:19,fontWeight:'700',color:'#fff',marginBottom:8},
 cardText:{fontSize:15,lineHeight:22,color:'#c7ccd2',textAlign:'center'}
});
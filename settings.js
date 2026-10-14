// 타이틀 설정: 원정 규칙 · 함께 대전 규칙(방장) · 플레이 환경. 브라우저에 저장합니다.
import {normRules,RULE_OPTIONS} from './engine.js';
const KEY='wuwa-resonance-settings';
export const ROOM_CHOICES={prepSeconds:[25,40,60],startLife:[60,100,150],pveEvery:[0,4,5,6],opening:[0,1,2,3],maxPlayers:[2,3,4,5]};
export const PLAY_CHOICES={speed:[1,2],sound:[false,true],motion:[true,false],autoBurst:[false,true]};
const DEFAULTS={rules:normRules({}),room:{prepSeconds:40,startLife:100,pveEvery:5,opening:2,maxPlayers:5},play:{speed:1,sound:false,motion:true,autoBurst:false}};
function clean(raw){
 const out=structuredClone(DEFAULTS);if(!raw||typeof raw!=='object')return out;
 out.rules=normRules(raw.rules||{});
 for(const [k,list] of Object.entries(ROOM_CHOICES))if(list.includes(raw.room?.[k]))out.room[k]=raw.room[k];
 for(const [k,list] of Object.entries(PLAY_CHOICES))if(list.includes(raw.play?.[k]))out.play[k]=raw.play[k];
 return out;
}
export function loadSettings(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{return clean(null);}}
export function saveSettings(v){try{localStorage.setItem(KEY,JSON.stringify(clean(v)));}catch{}}
export const resetSettings=()=>structuredClone(DEFAULTS);
export {RULE_OPTIONS};
// 화면에 보여 줄 이름
export const LABELS={
 rules:{title:'원정 규칙 (혼자 원정)',rounds:['원정 길이',v=>`${v}구역`],life:['시작 생존력',v=>`${v}`],gold:['시작 코인',v=>`${v} G`],difficulty:['난이도',v=>({easy:'쉬움',normal:'보통',hard:'어려움'})[v]]},
 room:{title:'함께 대전 규칙 (방장이 방을 만들 때 적용)',prepSeconds:['준비 시간',v=>`${v}초`],startLife:['시작 생존력',v=>`${v}`],pveEvery:['명식전 주기',v=>v?`${v}라운드마다`:'없음'],opening:['시작 잔상 토벌',v=>v?`${v}라운드`:'없음'],maxPlayers:['최대 인원',v=>`${v}명`]},
 play:{title:'플레이 환경',speed:['전투 속도',v=>`${v}×`],sound:['효과음',v=>v?'켜기':'끄기'],motion:['전투 연출',v=>v?'켜기':'끄기'],autoBurst:['혼자 원정 협주',v=>v?'자동 발동':'직접 발동']}
};

// 정보 도감: 공명자 · 유대와 공명 편성 · 잔상과 명식 · 규칙. 화면 HTML만 만듭니다.
import {HEROES,ENEMIES,TIERS,TIER_AT,TEAMS,CHAIN,ECHOS} from './engine.js';
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export const CODEX_TABS=[['heroes','공명자'],['synergy','유대 · 편성'],['foes','잔상 · 명식'],['rules','규칙']];
export function codexHtml(tab,{portrait,icon,elColor}){
 const nav=`<div class="codex-tabs" role="tablist">${CODEX_TABS.map(([id,label])=>`<button role="tab" data-codex="${id}" class="${id===tab?'on':''}" aria-selected="${id===tab}">${label}</button>`).join('')}</div>`;
 let body='';
 if(tab==='heroes'){
  body=`<div class="codex-grid">${HEROES.slice().sort((a,b)=>a.cost-b.cost||a.origin.localeCompare(b.origin)).map(h=>`<div class="codex-card" style="--hero:${h.color};--el:${elColor[h.origin]}">${portrait(h.id)}<div><small>${icon(h.origin)}${h.origin} · ${icon(h.role)}${h.role} · ${h.cost}G</small><b>${esc(h.name)}</b><em>${esc(h.skill)}</em><p>${esc(h.desc)}</p></div></div>`).join('')}</div>`;
 }else if(tab==='synergy'){
  body=`<h3 class="codex-h">유대 <small>서로 다른 공명자 ${TIER_AT.join(' / ')}명에서 단계별 강화</small></h3><div class="codex-list">${Object.keys(TIERS).map(t=>`<div class="codex-row" style="--el:${elColor[t]||'#e9dcb8'}"><span class="trait-icon">${icon(t)}</span><div><b>${t}</b>${TIER_AT.map((n,k)=>`<small><i>${n}</i>${TIERS[t].d(k)}</small>`).join('')}</div></div>`).join('')}</div>
  <h3 class="codex-h">공명 편성 <small>명조 파티 조합 · 세 명이 모두 전장에 있으면 아군 전체 보너스</small></h3><div class="codex-list teams">${TEAMS.map(t=>`<div class="codex-row"><span class="team-faces">${t.members.map(id=>portrait(id)).join('')}</span><div><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></div></div>`).join('')}</div>
  <h3 class="codex-h">공명 체인 <small>같은 공명자의 사본(★★=3장, ★★★=9장)</small></h3><div class="codex-list">${CHAIN.map(c=>`<div class="codex-row"><span class="chain-no">${c.n}</span><div><b>${esc(c.name)} · 사본 ${c.copies}장</b><small>${esc(c.desc)}</small></div></div>`).join('')}</div>`;
 }else if(tab==='foes'){
  const group=(kind,title,note)=>`<h3 class="codex-h">${title} <small>${note}</small></h3><div class="codex-grid foes">${ENEMIES.filter(e=>e.kind===kind).map(e=>`<div class="codex-card foe ${kind}" style="--hero:${e.color};--el:${e.color}">${portrait(e.id)}<div><small>${icon(e.origin)}${e.origin}${e.echo?` · 처치 시 에코 「${esc(ECHOS.find(x=>x.id===e.echo)?.name)}」`:''}</small><b>${esc(e.name)}</b><em>${esc(e.skill)}</em><p>${esc(e.desc)}</p></div></div>`).join('')}</div>`;
  body=group('tacet','잔상','일반 전투의 적')+group('elite','정예 잔상','4구역부터 · 깊은 잔향 경로에서 추가')+group('overlord','명식','3구역마다 등장하는 보스 · 함께 대전에서는 명식전 라운드');
 }else{
  body=`<div class="codex-rules">
  <p><b>혼자 원정</b>설정한 길이(9·12·15구역)만큼 잔상과 싸웁니다. 3구역마다 명식(보스)이 나타나고, 쓰러뜨리면 그 명식의 에코를 보상 후보로 얻습니다. 패배하면 생존력이 줄고 0이 되면 원정 종료.</p>
  <p><b>함께 대전 (2~5명)</b>롤토체스처럼 매 라운드 준비 → 전투. 처음 몇 라운드는 모두가 같은 잔상 무리와 싸우고(잔상 토벌), 이후에는 다른 플레이어와 대전합니다. 설정한 주기마다 명식전이 열립니다. 잔상·명식전은 연승·연패에 포함되지 않고, 이기면 코인과 에코를 얻습니다. 생존력이 0이 되면 탈락, 마지막 1인이 우승.</p>
  <p><b>모집과 승급</b>같은 공명자 3명 → ★★, 9명 → ★★★. 사본마다 공명 체인이 한 칸씩 열립니다. 모집 풀은 함께 대전에서 모든 플레이어가 공유합니다.</p>
  <p><b>유대와 편성</b>같은 속성 또는 역할의 서로 다른 공명자 2/3/4명으로 유대가 단계별로 강해집니다. 명조 파티 조합 세 명을 모두 배치하면 공명 편성 보너스가 추가됩니다.</p>
  <p><b>원작과의 차이</b>교대 액션을 자동 전투용으로 각색했습니다. 협주는 팀 공용이며, 변주 입장은 체인 3부터 해방 뒤 발동합니다. 원작의 개인 협주·반주·회피·패링을 재현한 규칙은 아닙니다. 유대·공명 체인 수치도 이 게임 전용입니다.</p>
  <p><b>협주 총공격</b>공격·해방으로 협주가 100이 되면 전원이 추격합니다. 혼자 원정은 직접 발동(설정에서 자동 가능), 함께 대전은 자동입니다.</p></div>`;
 }
 return nav+`<div class="codex-body">${body}</div>`;
}


(function(){
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const isEditor=!!document.body.classList.contains('editor-body');
 window.openCommandPalette=()=>{let m=$('#commandPalette');if(!m)return;m.classList.remove('hidden');$('#commandInput').focus();renderCommands('')};
 window.closeCommandPalette=()=>$('#commandPalette')?.classList.add('hidden');
 const commands=[['文字一覧へ','glyphs'],['字間・カーニングへ','spacing'],['プレビューへ','preview'],['フォント情報へ','fontinfo'],['レイヤーへ','layers'],['ガイド・定規へ','guides'],['コンポーネントへ','components'],['合字へ','ligatures'],['OpenTypeへ','opentype'],['バリアブルへ','variable'],['比較へ','compare'],['履歴・バックアップへ','history'],['設定へ','settings'],['書き出しへ','export']];
 function renderCommands(q){let box=$('#commandList');if(!box)return;box.innerHTML=commands.filter(x=>(x[0]+x[1]).toLowerCase().includes(q.toLowerCase())).map(x=>`<div class="command-item" data-command="${x[1]}">${x[0]} <small>${x[1].toUpperCase()}</small></div>`).join('')}
 if(isEditor){
  $('#commandInput')?.addEventListener('input',e=>renderCommands(e.target.value));
  $('#commandList')?.addEventListener('click',e=>{let x=e.target.closest('[data-command]');if(x){switchView(x.dataset.command);closeCommandPalette()}});
  $('#commandPalette')?.addEventListener('click',e=>{if(e.target.id==='commandPalette')closeCommandPalette()});
  $$('.doc-tab').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  function switchView(v){$$('.doc-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$$('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v)); if(v==='glyphs')renderGlyphLibrary();if(v==='spacing')renderKerning?.();if(v==='layers')renderLayers();if(v==='guides')renderGuides();if(v==='components')renderComponents();if(v==='ligatures')renderLigatures();if(v==='variable')renderAxes();if(v==='history')renderHistory();if(v==='compare')renderCompare();}
  window.switchView=switchView;
  function project(){return window.currentProject}
  function changed(){if(window.saveProject)window.saveProject(true)}
  window.addLayer=()=>{let p=project();p.layers=p.layers||[{id:'master',name:'マスター',visible:true}];p.layers.push({id:'L'+Date.now(),name:'新規レイヤー',visible:true});changed();renderLayers()};
  window.renderLayers=()=>{let p=project(),box=$('#layersPanel');if(!box||!p)return;let a=p.layers||[{id:'master',name:'マスター',visible:true}];box.innerHTML=a.map((l,i)=>`<div class="panel-row"><div><b>${l.name}</b><small>${l.visible?'表示中':'非表示'}</small></div><div><button onclick="toggleLayer(${i})">${l.visible?'隠す':'表示'}</button></div></div>`).join('')};
  window.toggleLayer=i=>{let p=project();p.layers[i].visible=!p.layers[i].visible;changed();renderLayers();draw?.()};
  window.addGuide=()=>{let p=project();p.guides=p.guides||[];p.guides.push({type:'horizontal',position:Math.round((p.unitsPerEm||1000)/2)});changed();renderGuides();draw?.()};
  window.renderGuides=()=>{let p=project(),box=$('#guidesPanel');if(!box||!p)return;box.innerHTML=(p.guides||[]).map((g,i)=>`<div class="panel-row"><div><b>${g.type==='horizontal'?'水平':'垂直'}ガイド</b><small>位置 ${g.position}</small></div><div><button onclick="removeGuide(${i})">削除</button></div></div>`).join('')||'<div class="panel-row">ガイドはありません</div>'};
  window.removeGuide=i=>{project().guides.splice(i,1);changed();renderGuides();draw?.()};
  window.addComponent=()=>{let p=project();p.components=p.components||[];let src=prompt('参照するGlyph','A');if(!src)return;p.components.push({id:'C'+Date.now(),source:src,target:currentGlyph||'A',x:0,y:0,scale:1});changed();renderComponents()};
  window.renderComponents=()=>{let box=$('#componentsPanel'),p=project();if(!box||!p)return;box.innerHTML=(p.components||[]).map((c,i)=>`<div class="panel-row"><div><b>${c.target} ← ${c.source}</b><small>X ${c.x} / Y ${c.y} / Scale ${c.scale}</small></div><button onclick="removeComponent(${i})">削除</button></div>`).join('')||'<div class="panel-row">コンポーネントはありません</div>'};
  window.removeComponent=i=>{project().components.splice(i,1);changed();renderComponents()};
  window.addLigature=()=>{let p=project();p.ligatures=p.ligatures||[];let input=prompt('入力文字（例: fi）','fi');let output=prompt('置換Glyph（例: ﬁ）','ﬁ');if(!input||!output)return;p.ligatures.push({input,output});changed();renderLigatures()};
  window.renderLigatures=()=>{let box=$('#ligaturePanel'),p=project();if(!box||!p)return;box.innerHTML=(p.ligatures||[]).map((l,i)=>`<div class="panel-row"><div><b>${l.input} → ${l.output}</b><small>OpenType liga</small></div><button onclick="removeLigature(${i})">削除</button></div>`).join('')||'<div class="panel-row">合字はありません</div>'};
  window.removeLigature=i=>{project().ligatures.splice(i,1);changed();renderLigatures()};
  window.addAxis=()=>{let p=project();p.axes=p.axes||[];p.axes.push({tag:'wght',name:'Weight',min:100,default:400,max:900,value:400});changed();renderAxes()};
  window.renderAxes=()=>{let box=$('#axisPanel'),p=project();if(!box||!p)return;box.innerHTML=(p.axes||[]).map((a,i)=>`<div class="axis-row"><input value="${a.name}" onchange="projectAxes()[${i}].name=this.value;saveProject(true)"><input type="range" min="${a.min}" max="${a.max}" value="${a.value}" oninput="setAxis(${i},this.value)"><output>${a.value}</output></div>`).join('')||'<div class="panel-row">軸がありません</div>'};
  window.projectAxes=()=>project().axes||[];window.setAxis=(i,v)=>{let a=project().axes[i];a.value=+v;let o=$$('.axis-row')[i]?.querySelector('output');if(o)o.value=v;let pv=$('#variablePreview');if(pv){let w=project().axes.find(x=>x.tag==='wght');pv.style.fontWeight=w?.value||400}changed()};
  window.createBackup=async()=>{let p=project();p.backups=p.backups||[];p.backups.unshift({time:new Date().toISOString(),data:JSON.parse(JSON.stringify(p))});p.backups=p.backups.slice(0,20);changed();renderHistory()};
  window.restoreLatest=()=>{let p=project();let b=p.backups?.[0];if(!b)return alert('バックアップがありません');window.currentProject=JSON.parse(JSON.stringify(b.data));if(window.populateGlyphs)populateGlyphs();if(window.loadGlyph)loadGlyph();changed();renderHistory()};
  window.renderHistory=()=>{let box=$('#historyPanel'),p=project();if(!box||!p)return;box.innerHTML=(p.backups||[]).map((b,i)=>`<div class="panel-row"><div><b>バックアップ ${i+1}</b><small>${new Date(b.time).toLocaleString('ja-JP')}</small></div><button onclick="restoreBackup(${i})">復元</button></div>`).join('')||'<div class="panel-row">バックアップはありません</div>'};
  window.restoreBackup=i=>{let p=project(),b=p.backups[i];if(!b)return;let keep=p.backups;window.currentProject=JSON.parse(JSON.stringify(b.data));currentProject.backups=keep;populateGlyphs();loadGlyph();changed();renderHistory()};
  window.autoKerning=()=>{let p=project();p.kerning=p.kerning||{};['AV','VA','To','Ta','Yo','WA','LT','Ly','Ty','Te'].forEach(pair=>{if(!p.kerning[pair[0]+'|'+pair[1]])p.kerning[pair[0]+'|'+pair[1]]=-40});changed();renderKerning?.()};
  window.openPlayground=()=>{switchView('preview');$('#previewText').focus()};
  window.renderCompare=()=>{let p=project(),a=$('#compareA'),b=$('#compareB');if(a)a.textContent='Aa '+(p.name||'My Font');if(b)b.textContent='Aa '+(p.family||'Default')};
  window.simplifySelected=()=>{if(!selected?.length)return; snapshot(); selected.forEach(h=>{let c=currentProject.glyphs[currentGlyph].contours[h.c];if(c&&c.length>8)currentProject.glyphs[currentGlyph].contours[h.c]=c.filter((_,i)=>i%2===0)});draw();changed()};
  window.reverseSelected=()=>{if(!selected?.length)return;snapshot();let seen=new Set();selected.forEach(h=>{if(seen.has(h.c))return;seen.add(h.c);let c=currentProject.glyphs[currentGlyph].contours[h.c];if(c)c.reverse()});draw();changed()};
  window.booleanOp=op=>{if((currentProject.glyphs[currentGlyph].contours||[]).length<2){alert('少なくとも2つの輪郭が必要です');return} snapshot();let cs=currentProject.glyphs[currentGlyph].contours; if(op==='union'){let merged=[...cs[0],...cs[1]];cs.splice(0,2,merged)}else if(op==='subtract'){cs.splice(1,1)}else if(op==='intersect'){cs.splice(0,2,cs[0].slice(0,Math.ceil(cs[0].length/2)))}draw();changed()};
  window.setNodeType=t=>{if(!selected?.length)return;selected.forEach(h=>{let p=currentProject.glyphs[currentGlyph].contours[h.c][h.i];p.type=t});draw();changed()};
  window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommandPalette()}if(e.key==='Escape')closeCommandPalette()});
  // glyph filters
  $$('.glyph-filters button').forEach(b=>b.addEventListener('click',()=>renderGlyphLibrary(b.dataset.filter)));
 }
})();

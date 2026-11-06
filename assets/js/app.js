(() => {
  "use strict";
  const config = window.NEURAL_OFFICE_CONFIG || {};
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const state = {paused:false,selectedAgent:null,activeView:"office",agents:config.agents||[],taskCount:12,ws:null};
  $("#agentCount").textContent=String(state.agents.length).padStart(2,"0");
  $("#floorAgentCount").textContent=String(state.agents.length).padStart(2,"0");
  $("#activeCount").textContent=String(state.agents.filter(a=>a.status==="working").length).padStart(2,"0");
  const toast = message => { const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2600); };
  const apiUrl = path => (config.api?.baseUrl||"").replace(/\/$/,"")+path;
  async function request(path, options={}) {
    const response = await fetch(apiUrl(path), {headers:{"Content-Type":"application/json",...(options.headers||{})},...options});
    if(!response.ok) throw new Error("API request failed ("+response.status+")");
    return response.status===204 ? null : response.json();
  }
  function updateConnection(connected) {
    const pill=$("#connectionPill");
    pill.classList.toggle("connected",connected);
    pill.querySelector("span").textContent=connected?"Backend connected":"Demo engine";
  }
  function updateAgentStatus(id,status) {
    const agent=state.agents.find(a=>a.id===id); if(agent) agent.status=status;
    const svg=$('[data-agent="'+id+'"]');
    if(svg) svg.classList.toggle("selected",status==="working" && state.selectedAgent===id);
    const row=$('[data-agent-select="'+id+'"]');
    if(row){const badge=$(".row-status",row);if(badge){badge.textContent=status==="working"?"Working":status==="error"?"Error":"Idle";badge.className="row-status "+(status==="working"?"working":"idle");}}
    $("#activeCount").textContent=String(state.agents.filter(a=>a.status==="working").length).padStart(2,"0");
  }
  function addActivity(title,detail,kind="violet") {
    const feed=$("#activityFeed"), item=document.createElement("div"); item.className="feed-item";
    const icon=document.createElement("span");icon.className="feed-icon "+kind;icon.textContent=kind==="blue"?"⌘":kind==="mint"?"⌕":"✧";
    const p=document.createElement("p"), b=document.createElement("b"), small=document.createElement("small");
    b.textContent=title; p.append(b,document.createTextNode(" "+detail));small.textContent="Just now · Agent workspace";p.append(small);item.append(icon,p);feed.prepend(item);
    while(feed.children.length>6) feed.lastElementChild.remove();
  }
  function renderAgentControls() {
    const list=$("#agentList"), select=$("#taskAgent");
    list.replaceChildren(); select.replaceChildren();
    state.agents.forEach(agent=>{
      const row=document.createElement("button"); row.type="button"; row.className="agent-row"; row.dataset.agentSelect=agent.id;
      const avatar=document.createElement("span"); avatar.className="agent-avatar "+(agent.color||"purple"); avatar.textContent=agent.name.slice(0,1);
      const info=document.createElement("span"); info.className="agent-info";
      const name=document.createElement("b"); name.textContent=agent.name;
      const role=document.createElement("small"); role.textContent=agent.role;
      info.append(name,role);
      const status=document.createElement("span"); status.className="row-status "+(agent.status==="working"?"working":"idle"); status.textContent=agent.status==="working"?"Working":"Idle";
      row.append(avatar,info,status); row.addEventListener("click",()=>selectAgent(agent.id)); list.append(row);
      const option=document.createElement("option"); option.value=agent.id; option.textContent=agent.name+" · "+agent.role; select.append(option);
    });
  }
  function openTaskModal(agentId) { $("#taskModal").classList.remove("hidden"); if(agentId) $("#taskAgent").value=agentId; $("#taskDescription").focus(); }
  function closeTaskModal() { $("#taskModal").classList.add("hidden"); }
  async function submitTask(event) {
    event.preventDefault();
    const description=$("#taskDescription").value.trim(), agentId=$("#taskAgent").value;
    if(!description) return;
    const agent=state.agents.find(a=>a.id===agentId);
    const payload={description,agentId,agentName:agent?.name||agentId,source:"neural-office-template",createdAt:new Date().toISOString()};
    try {
      if(config.demoMode || !config.api?.baseUrl) {
        updateAgentStatus(agentId,"working");
        addActivity(agent?.name||agentId,"accepted a demo task · "+description.slice(0,64),"mint");
        toast("Demo task assigned. Connect your backend for real execution.");
      } else {
        const result=await request(config.api.taskEndpoint||"/api/tasks",{method:"POST",body:JSON.stringify(payload)});
        updateAgentStatus(agentId,"working");
        addActivity(agent?.name||agentId,"received a new assignment","mint");
        toast(result?.message||"Task sent to the agent backend.");
      }
      state.taskCount++;$("#taskCount").textContent=String(state.taskCount).padStart(2,"0");closeTaskModal();$("#taskForm").reset();
    } catch(error) { toast(error.message||"Could not assign task."); }
  }
  function selectAgent(id) {
    state.selectedAgent=id;
    $$(".agent").forEach(el=>el.classList.toggle("selected",el.dataset.agent===id));
    const agent=state.agents.find(a=>a.id===id);
    if(agent) toast(agent.name+" · "+agent.role+" · "+agent.status);
  }
  const modules = {
    agents:["Agent directory","Configure your team, roles and runtime status.",()=>state.agents.map(a=>({title:a.name,sub:a.role+" · "+a.department,status:a.status})), "Create and configure agents in your connected backend."],
    workflows:["Workflow library","Reusable playbooks the Brain can distribute to agents.",()=>[{title:"Research → Brief",sub:"Collect sources, summarize findings and draft a report.",status:"Ready"},{title:"Build → Test → Review",sub:"Code implementation with automated validation.",status:"Ready"},{title:"Content pipeline",sub:"Plan, write and prepare social content.",status:"Ready"}],"Workflow templates are demo data. Connect your orchestration API to execute them."],
    projects:["Projects","A shared view of work moving through your virtual office.",()=>[{title:"Website refresh",sub:"Design system and frontend implementation",status:"In progress"},{title:"Market research",sub:"Competitor analysis and positioning",status:"Review"},{title:"Launch campaign",sub:"Content calendar and creative assets",status:"Planning"}],"Project records can be loaded from your own project API."],
    core:["The Brain / Core","The shared intelligence hub for skills, memory and task routing.",()=>[{title:"Skills library",sub:"26 skills available to the team",status:"Connected"},{title:"Workflow registry",sub:"14 reusable workflows",status:"Connected"},{title:"Shared memory",sub:"Context and project knowledge",status:"Ready"}],"Configure the Core in your backend. The office visualization mirrors real agent events."],
    settings:["Workspace settings","Customize the visual office and connect your agent runtime.",()=>[{title:"Appearance",sub:"Colors, room labels, agent names and office layout",status:"Configurable"},{title:"AI connection",sub:"REST endpoints and optional WebSocket event stream",status:config.api?.baseUrl?"Configured":"Not configured"},{title:"Demo mode",sub:"Safe local simulation without external API calls",status:config.demoMode?"Enabled":"Disabled"}],"Edit assets/js/config.js to configure the template."]
  };
  function showView(view) {
    state.activeView=view; $("#officeView").classList.toggle("hidden",view!=="office");$("#secondaryView").classList.toggle("hidden",view==="office");
    $$(".rail-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    if(view==="office") return;
    const mod=modules[view]||modules.agents;$("#secondaryTitle").textContent=mod[0];$("#secondaryDescription").textContent=mod[1];
    const content=$("#moduleContent");content.replaceChildren();
    const grid=document.createElement("div");grid.className="module-grid";
    mod[2]().forEach(item=>{const card=document.createElement("article");card.className="module-card";const h=document.createElement("h3"),p=document.createElement("p"),s=document.createElement("span");h.textContent=item.title;p.textContent=item.sub;s.className="status-tag";s.textContent=item.status;card.append(h,p,s);grid.append(card);});
    const note=document.createElement("p");note.className="muted";note.style.marginTop="20px";note.textContent=mod[3];content.append(grid,note);
  }

  // Continuous office-floor patrols. Agents physically travel between their department,
  // shared Brain/Core and neighboring workstations; pause/resume controls this loop.
  const movementRoutes = {
    nova:[[270,276],[330,292],[390,288],[460,288],[390,288],[330,292],[270,276]],
    atlas:[[170,492],[210,470],[280,440],[350,390],[420,335],[460,288],[420,335],[350,390],[250,455],[170,492]],
    echo:[[455,112],[455,155],[455,210],[460,250],[460,288],[460,250],[455,210],[455,155],[455,112]],
    pixel:[[650,244],[620,260],[585,275],[540,285],[500,288],[460,288],[500,288],[540,285],[585,275],[620,260],[650,244]],
    sage:[[185,355],[220,340],[270,325],[330,310],[390,295],[460,288],[390,295],[330,310],[270,325],[220,340],[185,355]],
    orbit:[[390,482],[405,445],[420,400],[440,350],[460,288],[440,350],[420,400],[405,445],[390,482]],
    muse:[[710,390],[680,370],[640,350],[600,325],[560,305],[510,292],[460,288],[510,292],[560,305],[600,325],[640,350],[680,370],[710,390]],
    flux:[[770,414],[740,395],[700,375],[660,350],[620,325],[580,305],[520,290],[460,288],[520,290],[580,305],[620,325],[660,350],[700,375],[740,395],[770,414]],
    quill:[[790,295],[750,290],[710,285],[670,280],[620,282],[560,285],[510,288],[460,288],[510,288],[560,285],[620,282],[670,280],[710,285],[750,290],[790,295]],
    bolt:[[115,525],[145,500],[180,475],[220,445],[270,405],[320,365],[380,325],[460,288],[380,325],[320,365],[270,405],[220,445],[180,475],[145,500],[115,525]]
  };
  const motion = new Map();
  function initAgentMotion(){
    $("#agentLayer .agent").forEach(el=>{
      const id=el.dataset.agent, route=movementRoutes[id];
      if(!route) return;
      const start=route[0];
      el.setAttribute("transform",`translate(${start[0]} ${start[1]})`);
      const ns="http://www.w3.org/2000/svg";
      const legs=document.createElementNS(ns,"g"); legs.setAttribute("class","bot-legs");
      for(const x of [-4,4]){const leg=document.createElementNS(ns,"path");leg.setAttribute("d",`M ${x} 6 l ${x<0?-2:2} 7`);leg.setAttribute("class","bot-leg");legs.append(leg);}
      const arms=document.createElementNS(ns,"path");arms.setAttribute("d","M-7 -2l-5 7m19-7 5 7");arms.setAttribute("class","bot-arms");el.append(legs,arms);
      motion.set(id,{el,route,index:0,x:start[0],y:start[1],progress:0,duration:0.85+Math.random()*0.55,wait:Math.random()*1.2,phase:Math.random()*Math.PI*2});
    });
  }
  let motionFrame=0,lastMotionTime=0;
  function animateAgents(time){
    if(!lastMotionTime) lastMotionTime=time;
    const dt=Math.min((time-lastMotionTime)/1000,.05); lastMotionTime=time;
    if(!state.paused){
      motion.forEach(m=>{
        if(m.wait>0){m.wait-=dt;return;}
        const a=m.route[m.index],b=m.route[(m.index+1)%m.route.length];
        const distance=Math.hypot(b[0]-a[0],b[1]-a[1]);
        m.progress+=dt/m.duration;
        const t=Math.min(m.progress,1),ease=t*t*(3-2*t);
        m.x=a[0]+(b[0]-a[0])*ease;m.y=a[1]+(b[1]-a[1])*ease;
        const angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
        const bob=Math.sin(time/95+m.phase)*1.15;
        m.el.setAttribute("transform",`translate(${m.x.toFixed(2)} ${(m.y+bob).toFixed(2)})`);
        m.el.classList.toggle("walking",distance>2);
        m.el.style.setProperty("--walk-angle",angle+"deg");
        if(t>=1){m.index=(m.index+1)%m.route.length;m.progress=0;m.duration=.8+Math.random()*.65;m.wait=.25+Math.random()*.8;}
      });
    }
    motionFrame=requestAnimationFrame(animateAgents);
  }

  function connectEvents() {
    if(!config.api?.websocketUrl || config.demoMode) return;
    try {
      const ws=new WebSocket(config.api.websocketUrl);state.ws=ws;
      ws.addEventListener("open",()=>updateConnection(true));
      ws.addEventListener("close",()=>updateConnection(false));
      ws.addEventListener("error",()=>updateConnection(false));
      ws.addEventListener("message",event=>{
        try { const data=JSON.parse(event.data);
          if(data.type==="agent.status") updateAgentStatus(data.agentId,data.status);
          if(data.type==="agent.activity") addActivity(data.agentName||"Agent",data.message||"updated status");
          if(data.type==="task.completed") {updateAgentStatus(data.agentId,"idle");addActivity(data.agentName||"Agent","completed a task","mint");}
        } catch(e) { console.warn("Ignored invalid agent event",e); }
      });
    } catch(error) { console.warn("WebSocket unavailable",error); }
  }
  $("#newTaskBtn").addEventListener("click",()=>openTaskModal());
  $("#closeModal").addEventListener("click",closeTaskModal);$("#cancelTask").addEventListener("click",closeTaskModal);
  $("#taskModal").addEventListener("click",e=>{if(e.target.id==="taskModal")closeTaskModal();});
  $("#taskForm").addEventListener("submit",submitTask);
  $("#pauseBtn").addEventListener("click",()=>{state.paused=!state.paused;$("#officeStage").classList.toggle("paused",state.paused);$("#pauseBtn").textContent=state.paused?"▶ Resume motion":"Ⅱ Pause motion";});
  $("#activityToggle").addEventListener("click",()=>$("#activityFeed").scrollIntoView({behavior:"smooth",block:"center"}));
  $("#expandOffice").addEventListener("click",()=>$("#officeStage").classList.toggle("expanded"));
  $("#viewAgentsBtn").addEventListener("click",()=>showView("agents"));$("#backOfficeBtn").addEventListener("click",()=>showView("office"));
  $$("[data-view]").forEach(el=>el.addEventListener("click",()=>showView(el.dataset.view)));
  $$("[data-agent-select]").forEach(el=>el.addEventListener("click",()=>selectAgent(el.dataset.agentSelect)));
  $$(".agent").forEach(el=>el.addEventListener("click",()=>selectAgent(el.dataset.agent)));
  $$(".room").forEach(el=>el.addEventListener("click",()=>{const room=el.dataset.room;const agent=state.agents.find(a=>a.department.toLowerCase().includes(room));toast((agent?.department||room)+" · Department selected");}));
  renderAgentControls();
  initAgentMotion();
  requestAnimationFrame(animateAgents);
  updateConnection(false);
  if(!config.demoMode && config.api?.baseUrl) {
    request(config.api.agentsEndpoint||"/api/agents").then(data=>{if(Array.isArray(data?.agents)){data.agents.forEach(a=>updateAgentStatus(a.id,a.status));updateConnection(true);}}).catch(()=>updateConnection(false));
  }
  connectEvents();
})();
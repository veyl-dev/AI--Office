(() => {
  "use strict";
  const config = window.NEURAL_OFFICE_CONFIG || {};
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const state = {paused:false,selectedAgent:null,activeView:"office",agents:config.agents||[],taskCount:12,ws:null};
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
  updateConnection(false);
  if(!config.demoMode && config.api?.baseUrl) {
    request(config.api.agentsEndpoint||"/api/agents").then(data=>{if(Array.isArray(data?.agents)){data.agents.forEach(a=>updateAgentStatus(a.id,a.status));updateConnection(true);}}).catch(()=>updateConnection(false));
  }
  connectEvents();
})();
/* Neural Office buyer configuration. Keep secrets on your server; never expose provider keys here. */
window.NEURAL_OFFICE_CONFIG = {
  appName: "Neural Office",
  workspaceName: "Workspace",
  demoMode: true,
  api: {
    // Point this to your own backend proxy. The browser should never call a provider with a secret key.
    baseUrl: "",
    taskEndpoint: "/api/tasks",
    agentsEndpoint: "/api/agents",
    eventsEndpoint: "/api/events",
    // Optional WebSocket endpoint for live agent status events.
    websocketUrl: ""
  },
  departments: ["Operations Hub","Intelligence Lab","Creative Studio","Research","Growth Lab","Project Room","Social Desk","Dev Workshop"],
  agents: [
    {id:"nova",name:"Nova",role:"Operations manager",department:"Operations Hub",status:"working",color:"purple"},
    {id:"atlas",name:"Atlas",role:"Developer",department:"Dev Workshop",status:"working",color:"blue"},
    {id:"echo",name:"Echo",role:"Researcher",department:"Intelligence Lab",status:"idle",color:"mint"},
    {id:"pixel",name:"Pixel",role:"Designer",department:"Creative Studio",status:"working",color:"orange"},
    {id:"sage",name:"Sage",role:"Analyst",department:"Growth Lab",status:"idle",color:"mint"},
    {id:"orbit",name:"Orbit",role:"Project Manager",department:"Project Room",status:"working",color:"purple"},
    {id:"muse",name:"Muse",role:"Writer",department:"Social Desk",status:"idle",color:"blue"},
    {id:"flux",name:"Flux",role:"Social Media",department:"Social Desk",status:"working",color:"orange"},
    {id:"quill",name:"Quill",role:"Researcher",department:"Research",status:"idle",color:"mint"},
    {id:"bolt",name:"Bolt",role:"Developer",department:"Dev Workshop",status:"working",color:"blue"}
  ]
};
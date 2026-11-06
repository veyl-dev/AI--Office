# Neural Office — AI Agent Workspace Template

A responsive, animated isometric office template for visualizing AI agents and their real backend activity. The floorplan uses a dark isometric environment, color-coded departments, miniature animated robot agents, and a central Brain/Core.

## Preview locally

No build step or package manager is required.

1. Download or clone this repository.
2. Open the folder in VS Code or another editor.
3. Run it with a local static server (for example, VS Code Live Server).
4. Open `index.html`.

## Included

- Isometric multi-department office floorplan inspired by the supplied visual reference.
- Animated, selectable agent characters and central Brain/Core.
- Operations, Intelligence, Creative, Research, Growth, Projects, Social and Development departments.
- Responsive desktop and mobile layouts.
- Agent directory, workflow library, project overview and Core/settings views.
- Task assignment modal.
- Clearly labeled simulated demo mode.
- REST API adapter and optional WebSocket event listener.
- Editable configuration in `assets/js/config.js`.

## Connect a real AI agent backend

The office is a visualization layer, not an AI runtime. Real work happens in your own backend or orchestration service. Keep provider API keys and secrets on the server; never place them in browser JavaScript.

Edit `assets/js/config.js`:

```js
window.NEURAL_OFFICE_CONFIG = {
  demoMode: false,
  api: {
    baseUrl: "https://your-backend.example.com",
    taskEndpoint: "/api/tasks",
    agentsEndpoint: "/api/agents",
    eventsEndpoint: "/api/events",
    websocketUrl: "wss://your-backend.example.com/api/events"
  }
};
```

Your backend should expose:

### POST /api/tasks

Request:

```json
{
  "description": "Review the checkout flow",
  "agentId": "atlas",
  "agentName": "Atlas",
  "source": "neural-office-template",
  "createdAt": "2026-11-06T10:00:00.000Z"
}
```

Return JSON such as:

```json
{ "taskId": "task_123", "status": "queued", "message": "Task queued" }
```

### GET /api/agents

Return:

```json
{
  "agents": [
    { "id": "atlas", "status": "working" },
    { "id": "echo", "status": "idle" }
  ]
}
```

### WebSocket events

Send JSON messages to update the visualization:

```json
{ "type": "agent.status", "agentId": "atlas", "status": "working" }
{ "type": "agent.activity", "agentName": "Atlas", "message": "Started code review" }
{ "type": "task.completed", "agentId": "atlas", "agentName": "Atlas" }
```

Supported status values are `working`, `idle` and `error`. Your orchestration backend executes the actual agent, tools, skills, workflows and project operations. This template displays events received from that backend.

## Customization

- Agent names, roles, departments and initial statuses: `assets/js/config.js`
- Office layout, colors, room shapes and character styling: `index.html` and `assets/css/styles.css`
- UI interactions and backend adapter: `assets/js/app.js`
- Room names and department colors: SVG groups in `index.html`

## Important notes

- Demo mode is enabled by default. It does not call an AI provider or perform real agent work.
- Set `demoMode: false` and configure your own backend to enable real task dispatch.
- Use HTTPS and secure authentication on your backend.
- Add authorization, rate limits, input validation, CSRF protection where applicable, and server-side provider key management before production use.
- Current character movement is decorative. To synchronize walking routes with real execution, extend the WebSocket event schema with navigation/department events and map those events to agent movement.

## License

Add your preferred commercial template license before distributing this project on a marketplace.

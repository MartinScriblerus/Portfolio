import { useAgentStore, Task } from './useAgentStore';

export function registerTasks(tasks: Task[]) {
  useAgentStore.getState().setTasks(tasks);
  if (tasks.length) useAgentStore.getState().startTask(tasks[0].id);
}

export function stepAgent() {
  const s = useAgentStore.getState();
  const task = s.tasks.find(t => t.id === s.currentTaskId);
  if (!task) return;
  if (s.status === 'asking' || s.status === 'checking') {
    const ok = task.check(s.telemetry);
    if (ok) {
      s.completeTask();
      task.onSuccess?.();
      // auto-advance after success
      setTimeout(() => useAgentStore.getState().nextTask(), 400);
    } else {
      // keep checking
      if (s.status !== 'checking') useAgentStore.setState({ status: 'checking' });
    }
  }
}

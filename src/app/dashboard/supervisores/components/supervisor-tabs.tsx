import { TabsContent } from '@/components/ui/tabs';
import { SupervisorData, SupervisorHandlers } from '../hooks/use-supervisor-data';
import { ProduccionTab } from './tabs/produccion-tab';
import { EmbalajeTab } from './tabs/embalaje-tab';
import { LimpiezaTasksTab } from './tabs/limpieza-tasks-tab';
import { LimpiezaRegistrosTab } from './tabs/limpieza-registros-tab';

interface SupervisorTabsProps {
  data: SupervisorData;
  handlers: SupervisorHandlers;
  userRole?: string;
  onRefresh: () => void;
}

export function SupervisorTabs({
  data,
  handlers,
  userRole,
  onRefresh
}: SupervisorTabsProps) {
  const isJefe = (userRole ?? '').toLowerCase() === 'jefe';

  return (
    <>
      <TabsContent value="produccion" className="space-y-4">
        <ProduccionTab
          categories={data.categories}
          handlers={handlers}
          isJefe={isJefe}
          onRefresh={onRefresh}
        />
      </TabsContent>

      <TabsContent value="embalaje" className="space-y-4">
        <EmbalajeTab
          records={data.embalajeRecords}
          categories={data.categories}
          handlers={handlers}
          isJefe={isJefe}
          onRefresh={onRefresh}
        />
      </TabsContent>

      <TabsContent value="limpieza-tareas" className="space-y-4">
        <LimpiezaTasksTab
          tasks={data.limpiezaTasks}
          handlers={handlers}
          isJefe={isJefe}
          onRefresh={onRefresh}
        />
      </TabsContent>

      <TabsContent value="limpieza-registros" className="space-y-4">
        <LimpiezaRegistrosTab
          registros={data.limpiezaRegistros}
          isJefe={isJefe}
          onRefresh={onRefresh}
        />
      </TabsContent>
    </>
  );
}

import React from 'react';

const TasksPage = (props: any) => {
  return (
    <div className="taskspage-container w-full h-full">
      {props.children}
    </div>
  );
};
export default TasksPage;

import React from 'react';

const AdminPage = (props: any) => {
  return (
    <div className="adminpage-container w-full h-full">
      {props.children}
    </div>
  );
};
export default AdminPage;

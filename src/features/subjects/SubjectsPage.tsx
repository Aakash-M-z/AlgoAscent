import React from 'react';

const SubjectsPage = (props: any) => {
  return (
    <div className="subjectspage-container w-full h-full">
      {props.children}
    </div>
  );
};
export default SubjectsPage;

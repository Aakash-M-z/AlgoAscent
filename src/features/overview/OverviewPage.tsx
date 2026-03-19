import React from 'react';

const OverviewPage = (props: any) => {
  return (
    <div className="overviewpage-container w-full h-full">
      {props.children}
    </div>
  );
};
export default OverviewPage;

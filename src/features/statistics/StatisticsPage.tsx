import React from 'react';

const StatisticsPage = (props: any) => {
  return (
    <div className="statisticspage-container w-full h-full">
      {props.children}
    </div>
  );
};
export default StatisticsPage;

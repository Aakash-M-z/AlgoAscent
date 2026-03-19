import React from 'react';

const BadgesPage = (props: any) => {
  return (
    <div className="badgespage-container w-full h-full">
      {props.children}
    </div>
  );
};
export default BadgesPage;

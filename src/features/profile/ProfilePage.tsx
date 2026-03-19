import React from 'react';

const ProfilePage = (props: any) => {
  return (
    <div className="profilepage-container w-full h-full">
      {props.children}
    </div>
  );
};
export default ProfilePage;

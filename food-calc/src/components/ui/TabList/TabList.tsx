import React from "react";
import s from "./TabList.module.css";
import Tab from "@/components/ui/Tab/Tab";

type Props = {
  children: React.ReactNode;
  isLoading: boolean;
};

const skeletons = new Array(3).fill("");

const TabList = (props: Props) => {
  const { children, isLoading } = props;
  return (
    <div className={s.container}>
      <ul className={s.tabList}>
        {children}
        {isLoading && (
          <>
            {skeletons.map((_) => (
              <Tab
                containerClassName={s.skeletonTab}
                innerClassName={s.skeletonTabInner}
                disabled={true}
                isActive={false}
                onClick={() => { }}
              >
                Загрузка
              </Tab>
            ))}
          </>
        )}
      </ul>
    </div>
  );
};

export default TabList;

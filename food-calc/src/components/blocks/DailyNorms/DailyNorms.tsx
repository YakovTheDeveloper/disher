import DailyNorm from "@/components/blocks/DailyNorms/DailyNorm";
import Container from "@/components/ui/Container/Container";
import RemoveButton from "@/components/ui/RemoveButton/RemoveButton";
import { Tab } from "@/components/ui/Tab";
import { TabList } from "@/components/ui/TabList";
import { rootDailyNormStore } from "@/store/rootStore";
import { observer } from "mobx-react-lite";
import React from "react";

const DailyNorms = () => {
  const {
    currentStore,
    stores,
    currentId,
    setCurrentId,
    isDraftId,
    remove,
    setCurrentDailyNormInUseId,
    dailyNormIdCurrentlyInUse,
    fetchManager,
  } = rootDailyNormStore;

  const { loading } = fetchManager;

  console.log(stores.length);

  return (
    <Container>
      <Container>
        <TabList isLoading={loading.all}>
          {stores.map(({ id, name }, i) => (
            <Tab
              before={
                <input
                  type="radio"
                  checked={id === dailyNormIdCurrentlyInUse}
                  onChange={() => setCurrentDailyNormInUseId(id)}
                />
              }
              key={id}
              draft={i === 0}
              onClick={() => setCurrentId(id)}
              isActive={currentId === id}
              after={
                isDraftId(id) ? null : (
                  <RemoveButton onClick={() => remove(id)} />
                )
              }
            >
              {name}
            </Tab>
          ))}
        </TabList>
      </Container>
      <Container boxShadow>
        {currentStore && <DailyNorm store={currentStore}></DailyNorm>}
      </Container>
    </Container>
  );
};

export default observer(DailyNorms);

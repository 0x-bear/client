import { Artifact, artifactNameFromArtifact, Planet } from '@darkforest_eth/types';
import _ from 'lodash';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { artifactName } from '../../Backend/Procedural/ArtifactProcgen';
import { formatNumber } from '../../Backend/Utils/Utils';
import { Wrapper } from '../../Backend/Utils/Wrapper';
import { ArtifactImage } from '../Components/ArtifactImage';
import { CenteredText, EmSpacer, FullWidth, ShortcutButton, Spacer } from '../Components/CoreUI';
import { EnergyIcon, SilverIcon } from '../Components/Icons';
import { LongDash, Sub, Subber } from '../Components/Text';
import WindowManager, { CursorState, TooltipName } from '../Game/WindowManager';
import { TooltipTrigger } from '../Panes/Tooltip';
import dfstyles from '../Styles/dfstyles';
import { useOnSendCompleted, usePlanetInactiveArtifacts, useUIManager } from '../Utils/AppHooks';
import { useOnUp } from '../Utils/KeyEmitters';
import { EXIT_PANE, TOGGLE_SEND } from '../Utils/ShortcutConstants';
import UIEmitter, { UIEmitterEvent } from '../Utils/UIEmitter';

const StyledSendResources = styled.div``;

const StyledRowIcon = styled.div`
  margin-right: 0.75em;
`;

const enum RowType {
  Energy,
  Silver,
  Artifact,
}

const energyKeysAndPercents = [
  ['1', 10],
  ['2', 20],
  ['3', 30],
  ['4', 40],
  ['5', 50],
  ['6', 60],
  ['7', 70],
  ['8', 80],
  ['9', 90],
  ['0', 100],
] as const;

const silverKeysAndPercents = [
  ['!', 10],
  ['@', 20],
  ['#', 30],
  ['$', 40],
  ['%', 50],
  ['^', 60],
  ['&', 70],
  ['*', 80],
  ['(', 90],
  [')', 100],
] as const;

function ResourceRowIcon({ rowType }: { rowType: RowType }) {
  return (
    <StyledRowIcon>
      {rowType === RowType.Energy && <EnergyIcon />}
      {rowType === RowType.Silver && <SilverIcon />}
    </StyledRowIcon>
  );
}

const StyledResourceBar = styled.div`
  margin: 0.5em;

  input[type='range'] {
    width: 100%;
  }

  & div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const StyledShowPercent = styled.div`
  display: inline-block;

  & > span:first-child {
    width: 3em;
    text-align: right;
    margin-right: 1em;
  }

  & > span:last-child {
    color: ${dfstyles.colors.subtext};
    & > span {
      ${dfstyles.prefabs.noselect};
      &:hover {
        color: ${dfstyles.colors.text};
        cursor: pointer;
      }
      &:first-child {
        margin-right: 0.5em;
      }
    }
  }
`;
function ShowPercent({
  value,
  setValue,
}: {
  value: number;
  setValue: Dispatch<SetStateAction<number>>;
}) {
  return (
    <StyledShowPercent>
      <span>{value}%</span>
      <span>
        <span onClick={() => setValue((x) => x - 1)}>
          <LongDash />
        </span>
        <span onClick={() => setValue((x) => x + 1)}>+</span>
      </span>
    </StyledShowPercent>
  );
}

function ResourceBar({
  isSilver,
  selected,
  value,
  setValue,
}: {
  isSilver?: boolean;
  selected: Planet | undefined;
  value: number;
  setValue: (x: number) => void;
}) {
  const getResource = useCallback(
    (val: number) => {
      if (!selected) return '';
      const resource = isSilver ? selected.silver : selected.energy;
      return formatNumber((val / 100) * resource);
    },
    [selected, isSilver]
  );

  return (
    <StyledResourceBar>
      <div>
        <div>
          <ResourceRowIcon rowType={isSilver ? RowType.Silver : RowType.Energy} />
          {getResource(value)}
          <EmSpacer width={1} />
          <Subber>{isSilver ? 'silver' : 'energy'}</Subber>
        </div>
        <ShowPercent value={value} setValue={setValue} />
      </div>
      <Spacer height={2} />
      <input
        type='range'
        min={0}
        max={100}
        value={value}
        step={1}
        onChange={(e) => setValue(parseInt(e.target.value))}
      />
    </StyledResourceBar>
  );
}

const RowWrapper = styled.div<{ artifacts: Artifact[] }>`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: 'space-around';
  align-items: center;
  overflow-x: scroll;
`;

const thumbActive = css`
  border: 1px solid ${dfstyles.colors.border};
  background-color: ${dfstyles.colors.border};
`;

const StyledArtifactThumb = styled.div<{ active: boolean }>`
  min-width: ${2.5}em;
  min-height: ${2.5}em;
  width: ${2.5}em;
  height: ${2.5}em;

  border: 1px solid ${dfstyles.colors.borderDark};
  border-radius: 1px;

  &:last-child {
    margin-right: none;
  }

  display: inline-flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;

  background: ${dfstyles.colors.artifactBackground};

  &:hover {
    ${thumbActive}
    cursor: pointer;

    & > div {
      filter: brightness(1.2);
    }
  }

  ${({ active }) => active && thumbActive}
`;

function ArtifactThumb({
  artifact,
  active,
  updateArtifactSending,
}: {
  active: boolean;
  updateArtifactSending: (a: Artifact) => void;
  artifact: Artifact;
}) {
  return (
    <TooltipTrigger name={TooltipName.Empty} extraContent={<>{artifactName(artifact)}</>}>
      <StyledArtifactThumb active={sendArtifact?.id === artifact.id} onClick={click}>
        <ArtifactImage artifact={artifact} thumb size={32} />
      </StyledArtifactThumb>
    </TooltipTrigger>
  );
}

function SelectArtifactRow({
  sendingArtifact,
  updateArtifactSending,
  inactiveArtifacts,
}: {
  sendingArtifact: Artifact | undefined;
  updateArtifactSending: (a: Artifact) => void;
  inactiveArtifacts: Artifact[];
}) {
  return (
    <RowWrapper artifacts={inactiveArtifacts}>
      {inactiveArtifacts.length > 0 &&
        inactiveArtifacts.map((a) => (
          <>
            <ArtifactThumb
              artifact={a}
              key={a.id}
              sendArtifact={sendArtifact}
              setSendArtifact={setSendArtifact}
            />
            <EmSpacer width={0.5} />
          </>
        ))}
      {inactiveArtifacts.length === 0 && <Sub>No movable artifacts!</Sub>}
    </RowWrapper>
  );
}

function SendRow({
  doSend,
  artifact,
  sending,
}: {
  doSend: () => void;
  artifact: Artifact | undefined;
  sending: boolean;
}) {
  return (
    <>
      <FullWidth>
        <ShortcutButton
          wide
          onClick={doSend}
          forceActive={sending}
          style={{ width: '100%' }}
          shortcutKey={TOGGLE_SEND}
        >
          <CenteredText>Send {artifact && <>+{artifactNameFromArtifact(artifact)}</>}</CenteredText>
        </ShortcutButton>
      </FullWidth>
    </>
  );
}

export function SendResources({
  planetWrapper: p,
}: {
  planetWrapper: Wrapper<Planet | undefined>;
}) {
  const uiManager = useUIManager();
  const [sending, setSending] = useState<boolean>(false);

  const windowManager = WindowManager.getInstance();

  const getEnergySending = useCallback(() => {
    return uiManager.getForcesSending(p?.value?.locationId);
  }, [p, uiManager]);

  const updateEnergySending = useCallback((energyPercent) => {
    if (!p.value || !uiManager) return;
    uiManager.setForcesSending(p.value.locationId, energyPercent);
  }, [p, uiManager]);

  const getSilverSending = useCallback(() => {
    return uiManager.getSilverSending(p?.value?.locationId);
  }, [p, uiManager]);

  const updateSilverSending = useCallback((silverPercent) => {
    if (!p.value || !uiManager) return;
    uiManager.setSilverSending(p.value.locationId, silverPercent);
  }, [p, uiManager]);

  const getArtifactSending = useCallback(() => {
    return uiManager.getArtifactSending(p?.value?.locationId);
  }, [p, uiManager]);

  const updateArtifactSending = useCallback((sendArtifact) => {
    if (!p.value || !uiManager) return;
    uiManager.setArtifactSending(p.value.locationId, sendArtifact);
  }, [p, uiManager]);

  const removeArtifactSending = useCallback(() => {
    if (!p.value || !uiManager) return;
    // Using 0 as a dummy value to remove artifacts
    uiManager.setArtifactSending(p.value.locationId, 0);
  }, [p, uiManager]);

  useEffect(() => {
    const uiEmitter = UIEmitter.getInstance();
    setSending(false);
    windowManager.setCursorState(CursorState.Normal);
    uiEmitter.emit(UIEmitterEvent.SendCancelled);
  }, [p.value?.locationId, windowManager]);

  const doSend = useCallback(() => {
    if (!uiManager || !windowManager) return;
    const uiEmitter = UIEmitter.getInstance();
    if (windowManager.getCursorState() === CursorState.TargetingForces) {
      setSending(false);
      windowManager.setCursorState(CursorState.Normal);
      uiEmitter.emit(UIEmitterEvent.SendCancelled);
    } else {
      setSending(true);
      windowManager.setCursorState(CursorState.TargetingForces);
      uiEmitter.emit(UIEmitterEvent.SendInitiated, p.value);
    }
  }, [p, windowManager, uiManager]);

  useOnUp(TOGGLE_SEND, doSend);
  useOnUp(EXIT_PANE, () => {
    if (!sending) uiManager.selectedPlanetId$.publish(undefined);
    else {
      UIEmitter.getInstance().emit(UIEmitterEvent.SendCancelled);
      setSending(false);
    }
  });

  // this variable is an array of 10 elements. each element is a key. whenever the user presses a
  // key, we set the amount of energy that we're sending to be proportional to how late in the array
  // that key is
  const energyShortcuts = '1234567890'.split('');

  // same as above, except for silver
  const silverShortcuts = '!@#$%^&*()'.split('');

  // for each of the above keys, we set up a listener that is triggered whenever that key is
  // pressed, and sets the corresponding resource sending amount
  for (let i = 0; i < energyShortcuts.length; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useOnUp(energyShortcuts[i], () => setEnergyPercent((i + 1) * 10));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useOnUp(silverShortcuts[i], () => setSilverPercent((i + 1) * 10));
  }

  useOnUp('-', () => setEnergyPercent((p) => _.clamp(p - 10, 0, 100)));
  useOnUp('=', () => setEnergyPercent((p) => _.clamp(p + 10, 0, 100)));
  useOnUp('_', () => setSilverPercent((p) => _.clamp(p - 10, 0, 100)));
  useOnUp('+', () => setSilverPercent((p) => _.clamp(p + 10, 0, 100)));

  useOnSendCompleted(() => {
    setSending(false);
    windowManager.setCursorState(CursorState.Normal);
    if (p && p.value) {
      // Set to undefined after SendComplete so it can send another one
      uiManager.setArtifactSending(p.value.locationId, undefined);
    }
  }, [windowManager, p, uiManager]);

    // kill the artifact when the move is pending
    for (const v of p.value.unconfirmedDepartures) {
      if (v.artifact === sendArtifact.id) {
        setSendArtifact(undefined);
        return;
      }
    }
  }, [p, sendArtifact]);

  useEffect(() => {
    if (!p.value) return;
    uiManager.setArtifactSending(p.value.locationId, sendArtifact);
  }, [sendArtifact, uiManager, p]);

  const artifacts = usePlanetInactiveArtifacts(p, uiManager);

  return (
    <StyledSendResources>
      <ResourceBar selected={p.value} value={getEnergySending()} setValue={updateEnergySending} />
      {p.value && p.value.silver > 0 && (
        <ResourceBar
          selected={p.value}
          value={getSilverSending()}
          setValue={updateSilverSending}
          isSilver
        />
      )}
      {p.value && artifacts.length > 0 && (
        <>
          <SelectArtifactRow inactiveArtifacts={artifacts} {...artifactProps} />
          <Spacer height={4} />
        </>
      )}

      <SendRow artifact={sendArtifact} doSend={doSend} sending={sending} />
    </StyledSendResources>
  );
}

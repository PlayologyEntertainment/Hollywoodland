import type { CareerState } from '../domain/CareerState';
import { currentRegion, getRegionById, REGIONS, travelQuote, travelStatus, type RegionId, type TravelStatus } from '../domain/Travel';
import { MAP_REGIONS, regionOutline, WORLD_MAP_SIZE, type MapRegion } from '../game/WorldMap';
import { t } from '../i18n';
import { regionName } from '../i18n/content';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface BusMapOptions {
  readonly dialog: HTMLDialogElement;
  readonly stage: HTMLElement;
  readonly info: HTMLElement;
  readonly closeButton: HTMLButtonElement;
  readonly imageUrl: string;
  readonly getState: () => CareerState;
  /** The player chose a region they can travel to right now. */
  readonly onTravel: (regionId: RegionId) => void;
  /** Gameplay keys are switched off while the map is open, so Enter on a region cannot also work the depot behind it. */
  readonly setGameplayActive: (active: boolean) => void;
}

/** What a region's state looks like on the map: lit where the player is, dim elsewhere. */
export type RegionVisualState = 'here' | 'ready' | 'poor' | 'locked';

export function visualStateFor(status: TravelStatus): RegionVisualState {
  return status === 'here' ? 'here' : status === 'ready' ? 'ready' : status === 'cannot-afford' ? 'poor' : 'locked';
}

/**
 * The Union Bus Depot's map of Hollywoodland. The picture is drawn dimmed and drained of colour, with a full-colour copy clipped to each
 * region on top, shown through a soft-edged elliptical spotlight, whose opacity says how lit it is: full where the player is; 55% when
 * hovered or focused; 85% when selected. There are no outlines. Choosing a region the player can reach (built, and the fare affordable) takes the bus; any other just selects
 * it and says why not. Each region is a keyboard-focusable button.
 */
export class BusMap {
  private readonly svg: SVGSVGElement;
  private readonly regionNodes = new Map<RegionId, SVGGElement>();
  private readonly tags = new Map<RegionId, HTMLElement>();
  private selected: RegionId | undefined;
  private hovered: RegionId | undefined;

  public constructor(private readonly options: BusMapOptions) {
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${WORLD_MAP_SIZE.width} ${WORLD_MAP_SIZE.height}`);
    this.svg.setAttribute('class', 'bus-map-svg');
    this.svg.setAttribute('role', 'group');
    this.svg.setAttribute('preserveAspectRatio', 'none');
    options.stage.replaceChildren(this.svg);
    options.closeButton.addEventListener('click', () => options.dialog.close());
    options.dialog.addEventListener('click', (event) => {
      if (event.target === options.dialog) options.dialog.close();
    });
    options.dialog.addEventListener('close', () => options.setGameplayActive(true));
    this.build();
  }

  public get isOpen(): boolean {
    return this.options.dialog.open;
  }

  /** Draws the map for the career as it stands and shows it, with the player's own region focused. */
  public open(): void {
    this.selected = undefined;
    this.hovered = undefined;
    this.refresh();
    this.options.setGameplayActive(false);
    if (!this.options.dialog.open) this.options.dialog.showModal();
    this.regionNodes.get(currentRegion(this.options.getState()))?.focus();
  }

  /** Repaints the regions' states and words (a language change, or the career moving on while the map is open). */
  public refresh(): void {
    const state = this.options.getState();
    this.svg.setAttribute('aria-label', t('busMap.title'));
    for (const region of REGIONS) {
      const status = travelStatus(state, region.id);
      const node = this.regionNodes.get(region.id);
      const tag = this.tags.get(region.id);
      const label = this.statusText(state, region.id, status);
      if (node !== undefined) {
        node.dataset['state'] = visualStateFor(status);
        node.setAttribute('aria-label', `${regionName(region)}. ${label}`);
        node.classList.toggle('is-selected', this.selected === region.id);
        node.classList.toggle('is-hover', this.hovered === region.id);
      }
      if (tag !== undefined) {
        tag.dataset['state'] = visualStateFor(status);
        const name = tag.querySelector('b');
        const small = tag.querySelector('small');
        if (name !== null) name.textContent = regionName(region);
        if (small !== null) small.textContent = label;
      }
    }
    this.paintInfo();
  }

  private build(): void {
    const defs = document.createElementNS(SVG_NS, 'defs');
    this.svg.append(defs);
    this.svg.append(this.image('bus-map-dim'));
    for (const mapRegion of MAP_REGIONS) {
      defs.append(this.spotlight(mapRegion));

      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('class', 'bus-map-region');
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', '0');
      group.dataset['region'] = mapRegion.id;
      const lit = document.createElementNS(SVG_NS, 'g');
      lit.setAttribute('mask', `url(#bus-map-spot-${mapRegion.id})`);
      lit.append(this.image('bus-map-lit'));
      group.append(lit, this.polygon(mapRegion, 'bus-map-hit'));
      this.attach(group, mapRegion.id);
      this.svg.append(group);
      this.regionNodes.set(mapRegion.id, group);

      const tag = document.createElement('div');
      tag.className = 'bus-map-tag bus-map-region-tag';
      tag.setAttribute('aria-hidden', 'true');
      tag.style.left = `${(mapRegion.label[0] / WORLD_MAP_SIZE.width) * 100}%`;
      tag.style.top = `${(mapRegion.label[1] / WORLD_MAP_SIZE.height) * 100}%`;
      tag.append(document.createElement('b'), document.createElement('small'));
      this.options.stage.append(tag);
      this.tags.set(mapRegion.id, tag);
    }
  }

  private image(className: string): SVGImageElement {
    const image = document.createElementNS(SVG_NS, 'image');
    image.setAttribute('href', this.options.imageUrl);
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', String(WORLD_MAP_SIZE.width));
    image.setAttribute('height', String(WORLD_MAP_SIZE.height));
    image.setAttribute('preserveAspectRatio', 'none');
    image.setAttribute('class', className);
    return image;
  }

  /** A mask holding a soft-edged ellipse fitted to the region: solid in the middle, feathering to nothing at the rim. */
  private spotlight(region: MapRegion): SVGMaskElement {
    const xs = region.points.map(([x]) => x);
    const ys = region.points.map(([, y]) => y);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const id = `bus-map-spot-${region.id}`;

    const gradient = document.createElementNS(SVG_NS, 'radialGradient');
    gradient.setAttribute('id', `${id}-fade`);
    for (const [offset, opacity] of [[0, 1], [0.7, 1], [1, 0]] as const) {
      const stop = document.createElementNS(SVG_NS, 'stop');
      stop.setAttribute('offset', String(offset));
      stop.setAttribute('stop-color', '#fff');
      stop.setAttribute('stop-opacity', String(opacity));
      gradient.append(stop);
    }

    const ellipse = document.createElementNS(SVG_NS, 'ellipse');
    ellipse.setAttribute('cx', String((minX + maxX) / 2));
    ellipse.setAttribute('cy', String((minY + maxY) / 2));
    const scale = 1.15 * (region.spotlightScale ?? 1);
    ellipse.setAttribute('rx', String(((maxX - minX) / 2) * scale));
    ellipse.setAttribute('ry', String(((maxY - minY) / 2) * scale));
    ellipse.setAttribute('fill', `url(#${id}-fade)`);

    const mask = document.createElementNS(SVG_NS, 'mask');
    mask.setAttribute('id', id);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', '0');
    mask.setAttribute('y', '0');
    mask.setAttribute('width', String(WORLD_MAP_SIZE.width));
    mask.setAttribute('height', String(WORLD_MAP_SIZE.height));
    mask.append(gradient, ellipse);
    return mask;
  }

  private polygon(region: MapRegion, className?: string): SVGPolygonElement {
    const polygon = document.createElementNS(SVG_NS, 'polygon');
    polygon.setAttribute('points', regionOutline(region));
    if (className !== undefined) polygon.setAttribute('class', className);
    return polygon;
  }

  private attach(node: SVGGElement, id: RegionId): void {
    node.addEventListener('pointerenter', () => this.setHover(id));
    node.addEventListener('pointerleave', () => this.setHover(undefined));
    node.addEventListener('focus', () => this.setHover(id));
    node.addEventListener('blur', () => this.setHover(undefined));
    node.addEventListener('click', () => this.choose(id));
    node.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) this.choose(id);
    });
  }

  private setHover(id: RegionId | undefined): void {
    this.hovered = id;
    this.refresh();
  }

  /** Selecting is what a click always does; if the trip is allowed it also sets off. On a touch screen, where a finger cannot hover to
   * look first, the first tap only selects (and shows the fare) and a second tap on the same place sets off. */
  private choose(id: RegionId): void {
    const needsConfirm = document.documentElement.classList.contains('touch') && this.selected !== id;
    this.selected = id;
    if (needsConfirm) {
      this.refresh();
      return;
    }
    const state = this.options.getState();
    if (travelStatus(state, id) === 'ready') {
      this.options.dialog.close();
      this.options.onTravel(id);
      return;
    }
    this.refresh();
  }

  /** The words under a region's name and in the info line: where you are, what a trip costs, or why you cannot go. */
  private statusText(state: CareerState, id: RegionId, status: TravelStatus): string {
    if (status === 'here') return t('busMap.here');
    if (status === 'coming-soon') return t('busMap.comingSoon');
    const quote = travelQuote(currentRegion(state), id);
    if (quote === undefined) return t('busMap.here');
    if (status === 'cannot-afford') return t('busMap.cannotAfford', { fare: quote.fare });
    return t('busMap.trip', { fare: quote.fare, slots: quote.slots });
  }

  private paintInfo(): void {
    const focus = this.hovered ?? this.selected;
    const info = this.options.info;
    info.classList.remove('is-warning');
    if (focus === undefined) {
      info.textContent = t('busMap.hint');
      return;
    }
    const region = getRegionById(focus);
    if (region === undefined) return;
    const state = this.options.getState();
    const status = travelStatus(state, focus);
    info.classList.toggle('is-warning', status === 'cannot-afford');
    const name = document.createElement('b');
    name.textContent = regionName(region);
    const touchHint = status === 'ready' && this.selected === focus && document.documentElement.classList.contains('touch');
    info.replaceChildren(name, ` — ${this.statusText(state, focus, status)}${touchHint ? ` · ${t('busMap.tapAgain')}` : ''}`);
  }
}

import { describe, expect, it, vi } from 'vitest';

import { DomainEventBus } from '../src/domain/DomainEventBus';

describe('domain event bus', () => {
  it('delivers emitted payloads to subscribers', () => {
    const bus = new DomainEventBus();
    const listener = vi.fn();
    bus.on('casting-office-entered', listener);
    bus.emit('casting-office-entered', undefined);
    expect(listener).toHaveBeenCalledWith(undefined);
  });

  it('calls every listener registered on the same event', () => {
    const bus = new DomainEventBus();
    const first = vi.fn();
    const second = vi.fn();
    bus.on('interaction-proximity-changed', first);
    bus.on('interaction-proximity-changed', second);
    bus.emit('interaction-proximity-changed', true);
    expect(first).toHaveBeenCalledWith(true);
    expect(second).toHaveBeenCalledWith(true);
  });

  it('never delivers to listeners on a different event name', () => {
    const bus = new DomainEventBus();
    const listener = vi.fn();
    bus.on('interaction-proximity-changed', listener);
    bus.emit('casting-office-entered', undefined);
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops delivery once the unsubscribe closure returned by on() is called', () => {
    const bus = new DomainEventBus();
    const listener = vi.fn();
    const unsubscribe = bus.on('interaction-proximity-changed', listener);
    unsubscribe();
    bus.emit('interaction-proximity-changed', true);
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops delivery once off() is called directly', () => {
    const bus = new DomainEventBus();
    const listener = vi.fn();
    bus.on('interaction-proximity-changed', listener);
    bus.off('interaction-proximity-changed', listener);
    bus.emit('interaction-proximity-changed', true);
    expect(listener).not.toHaveBeenCalled();
  });
});

// src/fabric/fabric.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Gateway, Wallets, Contract, Network } from 'fabric-network';

@Injectable()
export class FabricService implements OnModuleInit, OnModuleDestroy {
  private gateway = new Gateway();
  private network!: Network;
  private contract!: Contract;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const ccpPath = path.resolve(
      process.cwd(),
      this.config.getOrThrow<string>('FABRIC_CONNECTION_PROFILE'),
    );
    const ccp: Record<string, unknown> = JSON.parse(
      await fs.readFile(ccpPath, 'utf8'),
    );

    const walletPath = path.resolve(
      process.cwd(),
      this.config.getOrThrow<string>('FABRIC_WALLET_DIR'),
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = this.config.getOrThrow<string>('FABRIC_IDENTITY_LABEL');
    const discoveryEnabled = this.config.get<boolean>(
      'FABRIC_DISCOVERY_ENABLED',
      true,
    );
    const asLocalhost = this.config.get<boolean>('FABRIC_AS_LOCALHOST', true);

    await this.gateway.connect(ccp, {
      wallet,
      identity,
      discovery: { enabled: discoveryEnabled, asLocalhost },
    });

    this.network = await this.gateway.getNetwork(
      this.config.getOrThrow('FABRIC_CHANNEL'),
    );
    this.contract = this.network.getContract(
      this.config.getOrThrow('FABRIC_CONTRACT'),
    );
  }

  onModuleDestroy() {
    this.gateway.disconnect();
  }

  async recordTelemetry(key: string, payload: unknown) {
    await this.contract.submitTransaction(
      'RecordTelemetry',
      key,
      JSON.stringify(payload),
    );
  }

  async readTelemetry(key: string): Promise<any> {
    const res = await this.contract.evaluateTransaction('ReadTelemetry', key);
    return JSON.parse(res.toString());
  }

  async queryByDevice(deviceId: string): Promise<any[]> {
    const res = await this.contract.evaluateTransaction(
      'QueryByDevice',
      deviceId,
    );
    return JSON.parse(res.toString());
  }
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {FileEntry, MergeStrategy, Tree} from '../tree/interface';

import {Observable} from 'rxjs/Observable';
import {Url} from 'url';


/**
 * The description (metadata) of a collection. This type contains every information the engine
 * needs to run. The CollectionMetadataT type parameter contains additional metadata that you
 * want to store while remaining type-safe.
 */
export type CollectionDescription<CollectionMetadataT extends {}> = CollectionMetadataT & {
  readonly name: string;
};

/**
 * The description (metadata) of a schematic. This type contains every information the engine
 * needs to run. The SchematicMetadataT and CollectionMetadataT type parameters contain additional
 * metadata that you want to store while remaining type-safe.
 */
export type SchematicDescription<CollectionMetadataT extends {},
                                 SchematicMetadataT extends {}> = SchematicMetadataT & {
  readonly collection: CollectionDescription<CollectionMetadataT>;
  readonly name: string;
};


/**
 * The Host for the Engine. Specifically, the piece of the tooling responsible for resolving
 * collections and schematics descriptions. The SchematicMetadataT and CollectionMetadataT type
 * parameters contain additional metadata that you want to store while remaining type-safe.
 */
export interface EngineHost<CollectionMetadataT extends {}, SchematicMetadataT extends {}> {
  createCollectionDescription(name: string): CollectionDescription<CollectionMetadataT> | null;
  createSchematicDescription(
      name: string,
      collection: CollectionDescription<CollectionMetadataT>):
        SchematicDescription<CollectionMetadataT, SchematicMetadataT> | null;
  getSchematicRuleFactory<OptionT>(
      schematic: SchematicDescription<CollectionMetadataT, SchematicMetadataT>,
      collection: CollectionDescription<CollectionMetadataT>): RuleFactory<OptionT>;
  createSourceFromUrl(url: Url): Source | null;

  readonly defaultMergeStrategy?: MergeStrategy;
}


/**
 * The root Engine for creating and running schematics and collections. Everything related to
 * a schematic execution starts from this interface.
 *
 * CollectionMetadataT is, by default, a generic Collection metadata type. This is used throughout
 * the engine typings so that you can use a type that's merged into descriptions, while being
 * type-safe.
 *
 * SchematicMetadataT is a type that contains additional typing for the Schematic Description.
 */
export interface Engine<CollectionMetadataT extends {}, SchematicMetadataT extends {}> {
  createCollection(name: string): Collection<CollectionMetadataT, SchematicMetadataT>;
  createSchematic(
      name: string,
      collection: Collection<CollectionMetadataT, SchematicMetadataT>
  ): Schematic<CollectionMetadataT, SchematicMetadataT>;
  createSourceFromUrl(url: Url): Source;

  readonly defaultMergeStrategy: MergeStrategy;
}


/**
 * A Collection as created by the Engine. This should be used by the tool to create schematics,
 * or by rules to create other schematics as well.
 */
export interface Collection<CollectionMetadataT, SchematicMetadataT> {
  readonly description: CollectionDescription<CollectionMetadataT>;

  createSchematic(name: string): Schematic<CollectionMetadataT, SchematicMetadataT>;
}


/**
 * A Schematic as created by the Engine. This should be used by the tool to execute the main
 * schematics, or by rules to execute other schematics as well.
 */
export interface Schematic<CollectionMetadataT, SchematicMetadataT> {
  readonly description: SchematicDescription<CollectionMetadataT, SchematicMetadataT>;
  readonly collection: Collection<CollectionMetadataT, SchematicMetadataT>;

  call<T>(options: T, host: Observable<Tree>): Observable<Tree>;
}


/**
 * A SchematicContext. Contains information necessary for Schematics to execute some rules, for
 * example when using another schematics, as we need the engine and collection.
 */
export interface TypedSchematicContext<CollectionMetadataT, SchematicMetadataT> {
  readonly engine: Engine<CollectionMetadataT, SchematicMetadataT>;
  readonly schematic: Schematic<CollectionMetadataT, SchematicMetadataT>;
  readonly host: Observable<Tree>;
  readonly strategy: MergeStrategy;
}


/**
 * This is used by the Schematics implementations in order to avoid needing to have typing from
 * the tooling. Schematics are not specific to a tool.
 */
export type SchematicContext = TypedSchematicContext<any, any>;


/**
 * A rule factory, which is normally the way schematics are implemented. Returned by the tooling
 * after loading a schematic description.
 */
export type RuleFactory<T> = (options: T) => Rule;


/**
 * A FileOperator applies changes synchronously to a FileEntry. An async operator returns
 * asynchronously. We separate them so that the type system can catch early errors.
 */
export type FileOperator = (entry: FileEntry) => FileEntry | null;
export type AsyncFileOperator = (tree: FileEntry) => Observable<FileEntry | null>;


/**
 * A source is a function that generates a Tree from a specific context. A rule transforms a tree
 * into another tree from a specific context. In both cases, an Observable can be returned if
 * the source or the rule are asynchronous. Only the last Tree generated in the observable will
 * be used though.
 *
 * We obfuscate the context of Source and Rule because the schematic implementation should not
 * know which types is the schematic or collection metadata, as they are both tooling specific.
 */
export type Source = (context: SchematicContext) => Tree | Observable<Tree>;
export type Rule = (tree: Tree, context: SchematicContext) => Tree | Observable<Tree>;

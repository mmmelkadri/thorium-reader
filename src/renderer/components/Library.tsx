import * as React from "react";

import FontIcon     from "material-ui/FontIcon";
import IconButton   from "material-ui/IconButton";
import Snackbar     from "material-ui/Snackbar";
import { blue500 }  from "material-ui/styles/colors";

import { Store } from "redux";

import * as publicationimportActions from "readium-desktop/actions/collection-manager";
import * as publicationDownloadActions from "readium-desktop/actions/publication-download";

import { Publication } from "readium-desktop/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";
import { RendererState } from "readium-desktop/renderer/reducers";

import * as windowActions from "readium-desktop/renderer/actions/window";

import { Translator }   from "readium-desktop/i18n/translator";

import { Catalog } from "readium-desktop/models/catalog";

import { PublicationCard, PublicationListElement } from "readium-desktop/renderer/components/Publication/index";

import * as Dropzone from "react-dropzone";

interface ILibraryState {
    list: boolean;
    open: boolean;
}

interface LibraryProps {
    catalog: Catalog;
    handleRead: Function;
}

interface IDownload {
    link: string;
    progress: number;
}

const styles = {
    BookListElement: {
        container: {
            display: "inline-block",
            maxWidth: 1200,
            textAlign: "left",
        },
    },
    Library: {
        addButton: {
            float: "right",
            marginTop: "6px",
        },
        displayButton: {
            float: "right",
        },
        list: {
            textAlign: "center",
        },
        title: {
            display: "inline-block",
        },
        spinner: {
            top: "200px",
            fontSize: "40px",
        },
    },
};

export default class Library extends React.Component<LibraryProps, ILibraryState> {
    public state: ILibraryState;
    public props: LibraryProps;

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<RendererState>;

    @lazyInject("store")
    private  __ = this.translator.translate;

    private snackBarMessage: string = "";

    constructor(props: LibraryProps) {
        super(props);

        this.state = {
            open: false,
            list: false,
        };
    }

    public componentDidMount() {
        this.store.dispatch(windowActions.showLibrary());
    }

    // Called when files are droped on the dropzone
    public onDrop(acceptedFiles: File[], rejectedFiles: File[]) {
        this.importFiles(acceptedFiles);
    }

    // Create the download list if it doesn't exist then start the download
    public importFiles = (files: File[]) => {
        for (let file of files)
        {
            this.store.dispatch(publicationimportActions.fileImport([file.path]));
        }

        this.snackBarMessage = this.__("library.startFileImport");
        this.setState({open: true});
    }

    public downloadEPUB = (newPublication: Publication, publicationId: number) => {
        this.store.dispatch(publicationDownloadActions.add(newPublication));

        this.snackBarMessage = this.__("library.startDownload");
        this.setState({open: true});
    }

    public cancelDownload = (publication: Publication, publicationId: number) => {
        this.store.dispatch(publicationDownloadActions.cancel(publication));

        this.snackBarMessage = this.__("library.cancelDownload");
        this.setState({open: true});
    }

    public deletePublication = (identifier: string) => {
        this.store.dispatch(publicationimportActions.fileDelete(identifier));
    }

    public handleRequestClose = () => {
        this.setState({ open: false });
    }

    public Spinner () {
        return (
            <FontIcon
                style = {styles.Library.spinner}
                className="fa fa-spinner fa-spin fa-3x fa-fw"
                color={blue500}
            />
        );
    }

    public createCardList() {
        let list: any = [];
        for (let i = 0; i < this.props.catalog.publications.length; i++) {
            list.push(<PublicationCard key={i}
                publicationId={i}
                downloadable={false}
                publication={this.props.catalog.publications[i]}
                downloadEPUB={this.downloadEPUB}
                handleRead={this.props.handleRead.bind(this)}
                cancelDownload={this.cancelDownload.bind(this)}
                deletePublication={this.deletePublication.bind(this)} />);
        }
        return list;
    }

    public createElementList() {
        let list: any = [];
        for (let i = 0; i < this.props.catalog.publications.length; i++) {
            list.push(<PublicationListElement key={i}
                publication={this.props.catalog.publications[i]}
                publicationId={i}
                downloadEPUB={this.downloadEPUB}
                handleRead={this.props.handleRead.bind(this)}
                cancelDownload={this.cancelDownload} />);
        }
        return <div style={styles.BookListElement.container}> {list} </div>;
    }

    public render(): React.ReactElement<{}>  {
        const that = this;
        let listToDisplay: JSX.Element;
        if (this.props.catalog) {
            if (this.state.list) {
                listToDisplay = this.createElementList();
            } else {
                listToDisplay = this.createCardList();
            }
        } else {
            listToDisplay = <this.Spinner/>;
        }

        return (
            <Dropzone disableClick onDrop={this.onDrop.bind(this)} style={{}}>
                <div>
                    <h1 style={styles.Library.title}>{this.__("library.heading")}</h1>
                    <IconButton
                        style={styles.Library.displayButton}
                        touch={true} onClick={() => {
                            that.setState({list: true});
                        }}
                    >
                        <FontIcon className="fa fa-list" color={blue500} />
                    </IconButton>
                    <IconButton
                        style={styles.Library.displayButton}
                        touch={true}  onClick={() => {
                            that.setState({list: false});
                        }}
                    >
                        <FontIcon className="fa fa-th-large" color={blue500} />
                    </IconButton>
                </div >
                <div style={styles.Library.list}>
                    {listToDisplay}
                </div>

                <Snackbar
                        open={this.state.open}
                        message= {this.snackBarMessage}
                        autoHideDuration={4000}
                        onRequestClose={this.handleRequestClose}
                    />
            </Dropzone>
        );
    }
}

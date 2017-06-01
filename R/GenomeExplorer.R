#' Creates a Genome Explorer
#'
#' Creates a Genome Explorer for the given genome assembly.
#' 
#' @param genome Genome assembly to use. Valid values are hg19 and hg38. Instead of the
#'   name of the assembly, a cytobands data frame can be provided instead. See \code{\link{readCytobands}}.
#'
#' @import htmlwidgets
#'
#' @export
GenomeExplorer <- function(genome, width = "100%", height = "auto", elementId = NULL) {
  if (is.character(genome)) {
    if (grepl("hg[0-9]+", genome)) {
      f <- system.file("extdata", paste0("cytoBand.", genome, ".txt"), package = "GenomeExplorer")
      if (!file.exists(f)) {
        stop("Cytoband data for the given genome assembly is not bundled with Genome Explorer. Please provide a cytoband data frame instead.")
      }
      cytobands <- readCytobands(f)
      
    } else {
      stop("Invalid genome assembly. Try hg19 or hg38, for example.")
    }
    
  } else if (is.data.frame(genome)) {
    # TODO: Check that the data frame contains cytobands
    cytobands <- genome
  }

  # forward options using x
  x = list(
    genome = ifelse(is.character(genome), genome, NA), # Not used at JavaScript side
    cytobands = cytobands,
	  tracks = list(),
    annotations = list()
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'GenomeExplorer',
    x,
    width = width,
    height = height,
    package = 'GenomeExplorer',
    elementId = elementId
  )
}

#' Reads a cytobands file into a data frame
#'
#' This function can be used to load a cytoband file for a genome assembly
#' that is not supported out of the box by the GenomeExplorer. A loaded
#' data frame can be fed to GenomeExplorer instead of a name of a genome assembly.
#' 
#' An example of a cytoband file:
#' http://hgdownload.cse.ucsc.edu/goldenpath/hg19/database/cytoBand.txt.gz
#'
#' Cytoband files for some genome assemblies are included in the extdata directory
#'
#' @param file Path to the cytoband file
#' 
#' @export
readCytobands <- function(file) {
  read.table(
    file,
    sep = "\t", header = FALSE,
    col.names = c("chrom", "start", "end", "name", "gieStain")
  )
}

#' Adds a segment track to Genome Explorer
#' 
#' A segment is a region in a chromosome. It has start and end coordinates, which are
#' indexed in a UCSC style 1-indexed closed ranges.
#' 
#' A segment track uses a user-defined method for visualizing arbitrary columns
#' in the data. Currently supported methods are \code{simple} and \code{cnvAndBaf}.
#' 
#' @param ge The Genome Explorer object.
#' @param data A data frame that contains the segments being visualized.
#' @param discriminator An optional discriminator column that is used for
#'   spreading the data (cases) to subtracks.
#' @param chrom The column containing the name of the chromosome.
#' @param start The column containing the start coordinate of the genomic region.
#' @param end The column containing the end coordinate of the genomic region.
#' @param samples An optional vector that specifies the order of the samples.
#'   By default the samples are ordered alphabetically.
#' @param sample_labels An optional vector that specifies replacement labels
#'   for the samples.
#' @param vis Visualization to use.
#' @param vis_config Optional configuration options for the visualization.
#' @param title Title of the track.
#' @param subtrack_size Subtrack thickness (height) in pixels.
#' @param subtrack_padding Padding between the subtracks in proportion to thickness.
#' 
#' @export
segmentTrack <- function(ge, data, discriminator = NULL,
                      chrom = "chrom", start = "start", end = "end",
                      samples = NULL, sample_labels = NULL,
                      vis = "simple", vis_config = list(),
                      title = NULL,
                      subtrack_size = 30, subtrack_padding = 0.2) {
  
  x <- list(
    data = data,
    discriminator = discriminator,
    chrom = chrom,
    start = start,
    end = end,
    samples = samples,
    sample_labels = sample_labels,
    vis = vis,
    vis_config = vis_config,
    title = title,
    subtrack_size = subtrack_size,
    subtrack_padding = subtrack_padding
  )

  ge$x$tracks <- append(ge$x$tracks, list(x))

  ge
}

#' Adds a refseq gene annotation track to Genome Explorer
#'
#' @param refseq_genes_compressed A URL to "delta compressed" refseq genes. See utils/compressRefGene.py
#' 
#'   The server must allow cross origin requests by including the following HTTP header in responses:
#'   \code{Access-Control-Allow-Origin: *}
#'   
#'   If the URL is omitted, the genome data will be loaded from karilavikka.fi.
#'   
#' @export
refseqGeneTrack <- function(ge, refseq_genes_compressed = NULL) {
  # TODO: Support multiple gene tracks
  
  if (is.character(refseq_genes_compressed)) {
    url <- refseq_genes_compressed
    
  } else if (is.character(ge$x$genome)) {
    url = paste0("https://karilavikka.fi/genome-explorer/annotations/refSeq_genes.", ge$x$genome, ".compressed.txt")
    
  } else {
    stop("No genome assembly nor a URL to annotation data has been provided!")
  }
  
  ge$x$annotations <- append(ge$x$annotations, list(refseq_genes_compressed = url))
  
  ge
}

#' Zooms into a range
#' 
#' Currently the range must be specified as a search string, which accepts
#' the same search keywords and formats as the search field in the user interface.
#' 
#' @param search Search keyword to use for zooming in
#' 
#' @export
zoom <- function(ge, search) {
  ge$x$zoom$search <- search
  
  ge
}

#' Shiny bindings for GenomeExplorer
#'
#' Output and render functions for using GenomeExplorer within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a GenomeExplorer
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name GenomeExplorer-shiny
#'
#' @export
GenomeExplorerOutput <- function(outputId, width = '100%', height = 'auto'){
  htmlwidgets::shinyWidgetOutput(outputId, 'GenomeExplorer', width, height, package = 'GenomeExplorer')
}

#' @rdname GenomeExplorer-shiny
#' @export
renderGenomeExplorer <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, GenomeExplorerOutput, env, quoted = TRUE)
}

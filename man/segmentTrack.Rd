% Generated by roxygen2: do not edit by hand
% Please edit documentation in R/GenomeSpy.R
\name{segmentTrack}
\alias{segmentTrack}
\title{Adds a segment track to Genome Spy}
\usage{
segmentTrack(ge, data, discriminator = NULL, chrom = "chrom",
  start = "start", end = "end", samples = NULL, sampleLabels = NULL,
  vis = simpleVis(), title = NULL, subtrackSize = 30,
  subtrackPadding = 0.2)
}
\arguments{
\item{ge}{A GenomeSpy instance.}

\item{data}{A data frame that contains the segments being visualized.}

\item{discriminator}{An optional discriminator column that is used for
spreading the data (cases) to subtracks.}

\item{chrom}{The column containing the name of the chromosome.}

\item{start}{The column containing the start coordinate of the genomic region.}

\item{end}{The column containing the end coordinate of the genomic region.}

\item{samples}{An optional vector that specifies the order of the samples.
By default the samples are ordered alphabetically.}

\item{sampleLabels}{An optional vector that specifies replacement labels
for the samples.}

\item{vis}{Visualization to use. By default an unconfigured "simple" visualization
is used.}

\item{title}{Title of the track.}

\item{subtrackSize}{Subtrack thickness (height) in pixels.}

\item{subtrackPadding}{Padding between the subtracks in proportion to thickness.}
}
\value{
The same GenomeSpy instance that was passed in
}
\description{
A segment is a region in a chromosome. It has start and end coordinates, which are
indexed in UCSC style 1-indexed closed ranges.
}
\details{
A segment track uses a user-defined method for visualizing arbitrary columns
in the data. Currently supported methods are \code{\link{simpleVis}} and \code{\link{cnvVis}}.
}
\examples{
segmentTrack(
  ge
  data,
  discriminator = "patient",
  vis = simpleVis(color = "type")
)

}
